
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

const getGeminiKey = () => {
  const key = process.env.GEMINI_API_KEY || process.env.HUGGINGFACE_API_KEY;
  return typeof key === 'string' ? key.trim() : key;
};

// Gemini API keys start with "AIza". Warn once when the configured key
// doesn't match so a bad key is obvious instead of surfacing as opaque 400s.
let invalidKeyWarned = false;
const assertValidGeminiKey = (apiKey) => {
  if (!invalidKeyWarned && apiKey && !/^AIza[0-9A-Za-z_-]{30,}$/.test(apiKey)) {
    invalidKeyWarned = true;
    console.warn(
      '⚠️  Configured GEMINI_API_KEY does not look like a valid Google AI key ' +
      '(expected to start with "AIza"). Get a valid key at https://aistudio.google.com/app/apikey'
    );
  }
};

const getDefaultModel = () => {
  return process.env.AI_MODEL || 'gemini-2.5-flash';
};

const getFallbackModel = () => {
  return process.env.AI_FALLBACK_MODEL || 'gemini-3.5-flash-lite';
};

// Statuses worth retrying once against the fallback model.
// 429 = rate-limited, 5xx = provider-side failure, 404 = model not found/retired.
const isRetryableModelError = (status) => {
  return status === 429 || status === 404 || (status >= 500 && status <= 599);
};

/**
 * Open a streaming chat completion request for an explicit model
 */
const openChatStream = async (apiKey, model, conversationMessages) => {
  assertValidGeminiKey(apiKey);

  console.log(`Calling Gemini chat API (model: ${model})...`);

  const response = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: conversationMessages,
      max_tokens: 4096,
      temperature: 0.7,
      stream: true
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Gemini API Error (model: ${model}):`, response.status, errorText);
    let message = `API error: ${response.status}`;
    try {
      const parsed = JSON.parse(errorText);
      // Google sometimes wraps errors in an array: [{ error: { message, status } }]
      const errorData = Array.isArray(parsed) ? parsed[0] : parsed;
      message = errorData?.error?.message || errorData?.message || message;
    } catch {
      // keep default message
    }
    if (response.status === 400 && /valid.*api key/i.test(message)) {
      message =
        'Configured GEMINI_API_KEY was rejected by Google ("Please pass a valid API key"). ' +
        'Update it in .env with a valid key from https://aistudio.google.com/app/apikey and restart the backend.';
    }
    const error = new Error(message);
    error.status = response.status;
    error.retryable = isRetryableModelError(response.status);
    throw error;
  }

  return response;
};

/**
 * Streaming Chat with AI
 * POST /api/ai/chat
 * Handle multi-turn conversation with streaming response using Server-Sent Events
 */
exports.chatWithAI = async (req, res) => {
  try {
    const { messages, message } = req.body;

    // Validate input
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    const apiKey = getGeminiKey();
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'Gemini API key not configured'
      });
    }

    // Build conversation history
    const conversationMessages = [];

    // Add system prompt for better context
    conversationMessages.push({
      role: 'system',
      content: 'You are a helpful AI assistant. Provide clear, accurate, and helpful responses. When providing code, use proper formatting and explain your reasoning. Use markdown for formatting when appropriate.'
    });

    // Add previous messages if provided
    if (messages && Array.isArray(messages)) {
      messages.forEach(msg => {
        if (msg.role && msg.content) {
          conversationMessages.push({
            role: msg.role,
            content: msg.content
          });
        }
      });
    }

    // Add current message
    conversationMessages.push({
      role: 'user',
      content: message
    });

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const primaryModel = getDefaultModel();
    const fallbackModel = getFallbackModel();
    let activeModel = primaryModel;
    let response;

    try {
      response = await openChatStream(apiKey, primaryModel, conversationMessages);
    } catch (error) {
      // Retry once with the fallback model on transient failures.
      // 400/401/403 fail fast — retrying those only wastes quota.
      if (error.retryable && fallbackModel && fallbackModel !== primaryModel) {
        console.warn(
          `Primary model "${primaryModel}" failed (${error.status}). Retrying chat with fallback "${fallbackModel}"...`
        );
        activeModel = fallbackModel;
        try {
          response = await openChatStream(apiKey, fallbackModel, conversationMessages);
        } catch (fallbackError) {
          res.write(`data: ${JSON.stringify({ error: fallbackError.message || `API error: ${fallbackError.status || 'unknown'}` })}\n\n`);
          res.end();
          return;
        }
      } else {
        res.write(`data: ${JSON.stringify({ error: error.message || `API error: ${error.status || 'unknown'}` })}\n\n`);
        res.end();
        return;
      }
    }

    const reader = response.body?.getReader();
    if (!reader) {
      res.write(`data: ${JSON.stringify({ error: 'Failed to read response' })}\n\n`);
      res.end();
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let fullContent = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith('data: ')) {
            const data = trimmedLine.slice(6);
            
            if (data === '[DONE]') {
              res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              if (content) {
                fullContent += content;
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      }

      // Send final message
      res.write(`data: ${JSON.stringify({ done: true, fullContent, model: activeModel })}\n\n`);
    } catch (streamError) {
      console.error('Stream error:', streamError);
      res.write(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`);
    }

    res.end();
  } catch (error) {
    console.error('Chat API Error:', error.message);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process chat request'
    });
  }
};
