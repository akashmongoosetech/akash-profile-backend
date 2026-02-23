/**
 * AI Controller
 * Handles all AI-powered tool endpoints using OpenRouter AI
 * Free tier: $1 credit for new users, various free models available
 * 
 * Sign up at: https://openrouter.ai/
 */

// OpenRouter API - provides access to many free models
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Get API key and model from environment
const getOpenRouterKey = () => {
  return process.env.OPENROUTER_API_KEY || process.env.HUGGINGFACE_API_KEY;
};

// Get model from environment, use a known working free model
const getDefaultModel = () => {
  // Check for AI_MODEL env var, otherwise use DeepSeek which has free tier
  return process.env.AI_MODEL || 'deepseek/deepseek-chat';
};

// Fallback model
const DEFAULT_MODEL = getDefaultModel();

/**
 * Call OpenRouter AI API
 * @param {string} prompt - The prompt to send to the model
 * @returns {Promise<string>} - The generated text
 */
const callOpenRouterAPI = async (prompt) => {
  const apiKey = getOpenRouterKey();
  
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured. Please add OPENROUTER_API_KEY to .env.production');
  }

  console.log('Calling OpenRouter AI API...');

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://akashraikwar.in/',
        'X-Title': 'Akash Portfolio AI Tools',
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 512,
        temperature: 0.7,
      })
    });

    // Handle non-OK responses
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API Error:', response.status, errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error?.message || `API error: ${response.status}`);
      } catch {
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
    }

    const data = await response.json();
    console.log('OpenRouter API Response received');
    
    // Handle response format
    if (data?.choices?.[0]?.message?.content) {
      return data.choices[0].message.content;
    }
    
    // Handle error response
    if (data?.error) {
      throw new Error(data.error.message || data.error);
    }
    
    console.error('Unexpected response format:', data);
    throw new Error('Invalid response format from AI');
  } catch (error) {
    console.error('OpenRouter API call failed:', error.message);
    throw error;
  }
};

// Keep backward compatibility - alias function
const callHuggingFaceAPI = callOpenRouterAPI;

/**
 * Generate AI Email Reply
 * POST /api/ai/email-reply
 */
exports.generateEmailReply = async (req, res) => {
  try {
    const { originalEmail, tone, length } = req.body;

    // Validate inputs
    if (!originalEmail || originalEmail.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Original email content is required' 
      });
    }

    if (!tone || !['Professional', 'Friendly', 'Formal', 'Apology', 'Follow-up'].includes(tone)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid tone is required (Professional, Friendly, Formal, Apology, Follow-up)' 
      });
    }

    // Determine length constraints
    const lengthMap = {
      'Short': 'Keep it brief, 2-3 sentences',
      'Medium': 'Moderate length, 1 paragraph',
      'Long': 'Detailed response, 2-3 paragraphs'
    };

    // Build prompt for email reply generation
    const prompt = `You are a professional email writing assistant. Generate a ${tone.toLowerCase()} email reply based on the following original email.

Original Email:
${originalEmail}

Requirements:
- Tone: ${tone}
- Length: ${lengthMap[length] || 'Moderate length'}
- Make it contextual and relevant to the original email
- Include appropriate greeting and sign-off

Generate the email reply:`;

    const generatedReply = await callHuggingFaceAPI(prompt);

    res.json({
      success: true,
      data: {
        reply: generatedReply.trim(),
        tone,
        length
      }
    });

  } catch (error) {
    console.error('Email Reply Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate email reply'
    });
  }
};

/**
 * Generate LinkedIn Post for Developers
 * POST /api/ai/linkedin-post
 */
exports.generateLinkedInPost = async (req, res) => {
  try {
    const { topic, experienceLevel, postType, includeHashtags } = req.body;

    // Validate inputs
    if (!topic || topic.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Topic is required' 
      });
    }

    if (!experienceLevel || !['Student', 'Junior', 'Mid', 'Senior'].includes(experienceLevel)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid experience level is required (Student, Junior, Mid, Senior)' 
      });
    }

    if (!postType || !['Educational', 'Storytelling', 'Achievement', 'Hiring', 'Opinion'].includes(postType)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid post type is required (Educational, Storytelling, Achievement, Hiring, Opinion)' 
      });
    }

    // Build prompt for LinkedIn post generation
    const hashtagsSection = includeHashtags 
      ? 'Include 3-5 relevant hashtags at the end.' 
      : 'Do not include hashtags.';

    const prompt = `You are a professional LinkedIn content creator specializing in tech/dev content. Generate an engaging LinkedIn post for a ${experienceLevel} level developer.

Topic: ${topic}
Post Type: ${postType}
Experience Level: ${experienceLevel}

Requirements:
- Post Type Style: ${postType}
- Target Audience: Tech professionals, developers, recruiters
- ${hashtagsSection}
- Make it authentic and engaging
- Include a hook/attention grabber
- Include a call-to-action if appropriate
- Keep it professional but conversational
- For ${experienceLevel} level: adjust tone and content accordingly

Generate the LinkedIn post:`;

    const generatedPost = await callHuggingFaceAPI(prompt);

    // Extract hashtags if included
    let hashtags = [];
    if (includeHashtags) {
      const hashtagMatch = generatedPost.match(/#[\w-]+/g);
      if (hashtagMatch) {
        hashtags = hashtagMatch;
      }
    }

    res.json({
      success: true,
      data: {
        post: generatedPost.trim(),
        hashtags,
        metadata: {
          topic,
          experienceLevel,
          postType,
          includeHashtags
        }
      }
    });

  } catch (error) {
    console.error('LinkedIn Post Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate LinkedIn post'
    });
  }
};

/**
 * Generate Project Ideas for Students
 * POST /api/ai/project-ideas
 */
exports.generateProjectIdeas = async (req, res) => {
  try {
    const { technology, difficultyLevel, projectType, numberOfIdeas } = req.body;

    // Validate inputs
    if (!technology || technology.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Technology is required' 
      });
    }

    if (!difficultyLevel || !['Beginner', 'Intermediate', 'Advanced'].includes(difficultyLevel)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid difficulty level is required (Beginner, Intermediate, Advanced)' 
      });
    }

    if (!projectType || !['Web App', 'Mobile App', 'AI Tool', 'SaaS', 'Automation'].includes(projectType)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid project type is required (Web App, Mobile App, AI Tool, SaaS, Automation)' 
      });
    }

    const numIdeas = Math.min(Math.max(parseInt(numberOfIdeas) || 3, 1), 5);

    // Build prompt for project ideas generation
    const prompt = `You are a tech project advisor for students. Generate ${numIdeas} project ideas with the following specifications:

Technology: ${technology}
Difficulty Level: ${difficultyLevel}
Project Type: ${projectType}

For EACH project idea, provide:
1. Project Name (catchy and descriptive)
2. Short Description (2-3 sentences)
3. Key Features (3-5 bullet points)
4. Tech Stack (specific technologies to use)
5. Bonus Feature (optional advanced feature)

Make sure:
- Projects are appropriate for ${difficultyLevel} level
- Projects use ${technology} as the main technology
- Projects are practical and achievable
- Include real-world use cases
- Make descriptions detailed enough to understand the project

Format your response as a structured list with clear headings for each project.`;

    const generatedIdeas = await callHuggingFaceAPI(prompt);

    // Parse the response into structured data
    const projects = parseProjectIdeas(generatedIdeas, numIdeas);

    res.json({
      success: true,
      data: {
        projects,
        count: projects.length,
        metadata: {
          technology,
          difficultyLevel,
          projectType,
          numberOfIdeas: numIdeas
        }
      }
    });

  } catch (error) {
    console.error('Project Ideas Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate project ideas'
    });
  }
};

/**
 * Parse raw AI response into structured project ideas
 */
const parseProjectIdeas = (rawText, expectedCount) => {
  const projects = [];
  
  // Split by numbered projects (1., 2., etc.) or "Project" headings
  const projectSections = rawText.split(/(?:^|\n)(?:\d+\.|[Pp]roject\s+\d+:?)/).filter(s => s.trim());
  
  for (let i = 0; i < Math.min(projectSections.length, expectedCount); i++) {
    const section = projectSections[i].trim();
    const lines = section.split('\n').filter(l => l.trim());
    
    const project = {
      name: `Project ${i + 1}`,
      description: '',
      features: [],
      techStack: '',
      bonusFeature: ''
    };
    
    // Extract project name (usually first line or contains "Name:")
    const nameLine = lines.find(l => l.match(/^[Nn]ame:/) || (i === 0 && lines.indexOf(l) < 2));
    if (nameLine) {
      project.name = nameLine.replace(/^[Nn]ame:\s*/, '').trim();
    }
    
    // Extract description (usually after name or contains "Description:")
    const descLine = lines.find(l => l.match(/^[Dd]escription:/));
    if (descLine) {
      project.description = descLine.replace(/^[Dd]escription:\s*/, '').trim();
    } else if (lines.length > 1) {
      // Use second line as description if no explicit label
      const secondLine = lines[1]?.replace(/^[-\•]\s*/, '').trim();
      if (secondLine && !secondLine.includes(':')) {
        project.description = secondLine;
      }
    }
    
    // Extract features (lines starting with - or • or containing "Features:")
    const featuresLines = lines.filter(l => 
      l.match(/^[-\•]/) || 
      l.match(/^[Ff]eature/) ||
      l.match(/^[-•]\s+/)
    );
    project.features = featuresLines.map(f => f.replace(/^[-\•\s]+/, '').replace(/^[Ff]eatures:?\s*/i, '')).filter(f => f);
    
    // Extract tech stack
    const techLine = lines.find(l => l.match(/^[Tt]ech\s*[Ss]tack:/) || l.match(/^[Tt]echnolog/));
    if (techLine) {
      project.techStack = techLine.replace(/^[Tt]echnolog(y|ies):\s*/, '').replace(/^[Tt]ech\s*[Ss]tack:\s*/, '').trim();
    }
    
    // Extract bonus feature
    const bonusLine = lines.find(l => l.match(/^[Bb]onus/) || l.match(/^[Aa]dvanced/));
    if (bonusLine) {
      project.bonusFeature = bonusLine.replace(/^[Bb]onus:?\s*/, '').replace(/^[Aa]dvanced:?\s*/, '').trim();
    }
    
    // If we couldn't parse well, use the raw section
    if (!project.description && section) {
      const sentences = section.split(/[.!?]+/).filter(s => s.trim());
      project.description = sentences.slice(0, 2).join('. ').trim();
    }
    
    projects.push(project);
  }
  
  // If parsing failed, return raw text as fallback
  if (projects.length === 0) {
    return [{
      name: 'Generated Project',
      description: rawText.substring(0, 200) + '...',
      features: ['See full description for details'],
      techStack: technology,
      bonusFeature: 'Explore advanced features'
    }];
  }
  
  return projects;
};
