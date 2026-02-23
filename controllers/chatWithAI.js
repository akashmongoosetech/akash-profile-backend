
// OpenRouter API configuration - shared from aiController
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const getOpenRouterKey = () => {
  return process.env.OPENROUTER_API_KEY || process.env.HUGGINGFACE_API_KEY;
};

const getDefaultModel = () => {
  return process.env.AI_MODEL || 'deepseek/deepseek-chat';
};

const DEFAULT_MODEL = getDefaultModel();

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

    const apiKey = getOpenRouterKey();
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'OpenRouter API key not configured'
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

    // Make streaming request to OpenRouter
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://akashraikwar.in/',
        'X-Title': 'Akash Portfolio AI Chat',
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: conversationMessages,
        max_tokens: 2048,
        temperature: 0.7,
        stream: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API Error:', response.status, errorText);
      res.write(`data: ${JSON.stringify({ error: `API error: ${response.status}` })}\n\n`);
      res.end();
      return;
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
      res.write(`data: ${JSON.stringify({ done: true, fullContent })}\n\n`);
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
