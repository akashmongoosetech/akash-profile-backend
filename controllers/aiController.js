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

/**
 * Validate Business Idea for Indian Market
 * POST /api/ai/business-idea-validator
 */
exports.validateBusinessIdea = async (req, res) => {
  try {
    const { businessIdea, location, targetAudience, budget, industryType, revenueModel } = req.body;

    // Validate required inputs
    if (!businessIdea || businessIdea.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Business idea description is required' 
      });
    }

    if (!location || location.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Target location is required' 
      });
    }

    if (!targetAudience || targetAudience.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Target audience is required' 
      });
    }

    if (!budget || budget.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Estimated budget is required' 
      });
    }

    if (!industryType || industryType.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Industry type is required' 
      });
    }

    // Build prompt for business idea validation
    const prompt = `You are an expert business analyst specializing in the Indian startup ecosystem. Validate the following business idea with comprehensive India-specific market analysis.

BUSINESS IDEA: ${businessIdea}
TARGET LOCATION: ${location}
TARGET AUDIENCE: ${targetAudience}
ESTIMATED BUDGET: ${budget}
INDUSTRY TYPE: ${industryType}
REVENUE MODEL: ${revenueModel || 'Not specified'}

Provide a detailed validation report with the following sections:

1. MARKET DEMAND ANALYSIS (India-Specific)
- Current market demand and trends
- Growth potential in ${location}
- Seasonal factors affecting business

2. TARGET CUSTOMER BREAKDOWN
- Demographics
- Customer segments
- Purchasing behavior patterns

3. COMPETITOR LANDSCAPE (Indian Market)
- Major competitors
- Market share analysis
- Competitive advantages

4. ESTIMATED STARTUP COST RANGE (in INR)
- Initial investment needed
- Break-even timeline

5. LEGAL/REGISTRATION REQUIREMENTS IN INDIA
- Required licenses and permits
- GST implications
- FDI norms if applicable

6. MONETIZATION STRATEGY
- Revenue streams
- Pricing strategy for Indian market
- Unit economics

7. RISK ASSESSMENT
- Market risks
- Operational risks
- Regulatory risks
- Mitigation strategies

8. SCALABILITY POTENTIAL
- Growth opportunities
- Expansion plans
- Technology leverage

9. OVERALL VIABILITY SCORE (1-10)
Provide a numerical score with justification

10. CLEAR RECOMMENDATION
Go/No-Go decision with key reasons

Format the response with clear headings and bullet points. Be specific to India's business environment.`;

    const validationResult = await callHuggingFaceAPI(prompt);

    res.json({
      success: true,
      data: {
        validation: validationResult.trim(),
        metadata: {
          businessIdea,
          location,
          targetAudience,
          budget,
          industryType,
          revenueModel
        }
      }
    });

  } catch (error) {
    console.error('Business Idea Validator Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to validate business idea'
    });
  }
};

/**
 * Generate Startup Names
 * POST /api/ai/startup-name-generator
 */
exports.generateStartupNames = async (req, res) => {
  try {
    const { industry, brandPersonality, targetAudience, namePreference, checkDomain, numberOfNames } = req.body;

    // Validate required inputs
    if (!industry || industry.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Industry is required' 
      });
    }

    if (!brandPersonality || brandPersonality.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Brand personality is required' 
      });
    }

    if (!targetAudience || targetAudience.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Target audience is required' 
      });
    }

    const preference = namePreference || 'Two-word';
    const count = Math.min(Math.max(numberOfNames || 10, 1), 30); // Limit between 1-30

    // Build prompt for startup name generation
    const prompt = `You are an expert brand strategist and naming expert. Generate ${count} creative startup names with the following specifications:

INDUSTRY: ${industry}
BRAND PERSONALITY: ${brandPersonality}
TARGET AUDIENCE: ${targetAudience}
NAME PREFERENCE: ${preference}

For EACH name, provide:
1. Startup Name (catchy and memorable)
2. Meaning/Origin (etymology or concept behind the name)
3. Brand Positioning (how the name positions the brand)
4. Tagline Suggestion (1-2 taglines that complement the name)
5. Domain Style Suggestion (.com, .in, .ai, .io, .co)

Make sure:
- Names are unique and memorable
- Names are easy to pronounce and spell
- Names work well for Indian and global audiences
- Names are available as domain names (use domain style suggestions)
- Include a mix of:
  - Sanskrit/Hindi-inspired names (if appropriate)
  - Modern tech-inspired names
  - Hybrid English names
  - One-word brands (if ${preference.toLowerCase().includes('one')})
- Consider ${brandPersonality.toLowerCase()} brand personality
- Target audience: ${targetAudience}

Format as a numbered list with clear sections for each name.`;

    const generatedNames = await callHuggingFaceAPI(prompt);

    // Parse the response into structured data
    const names = parseStartupNames(generatedNames);

    res.json({
      success: true,
      data: {
        names,
        count: names.length,
        metadata: {
          industry,
          brandPersonality,
          targetAudience,
          namePreference: preference,
          checkDomain: checkDomain || false,
          numberOfNames: count
        }
      }
    });

  } catch (error) {
    console.error('Startup Name Generator Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate startup names'
    });
  }
};

/**
 * Parse raw AI response into structured startup names
 */
const parseStartupNames = (rawText) => {
  const names = [];
  
  // Split by numbered entries
  const nameSections = rawText.split(/\n(?=\d+\.?\s)/).filter(s => s.trim());
  
  for (const section of nameSections) {
    const lines = section.split('\n').filter(l => l.trim());
    
    if (lines.length > 0) {
      const nameEntry = {
        name: '',
        meaning: '',
        positioning: '',
        tagline: '',
        domainStyle: ''
      };
      
      // Extract name (usually first non-empty line)
      const nameLine = lines[0].replace(/^\d+\.\s*/, '').trim();
      nameEntry.name = nameLine;
      
      // Extract other fields
      for (const line of lines) {
        const lowerLine = line.toLowerCase();
        if (lowerLine.includes('meaning') || lowerLine.includes('origin') || lowerLine.includes('concept')) {
          nameEntry.meaning = line.replace(/^[\w\s]+:\s*/i, '').trim();
        } else if (lowerLine.includes('positioning') || lowerLine.includes('brand')) {
          nameEntry.positioning = line.replace(/^[\w\s]+:\s*/i, '').trim();
        } else if (lowerLine.includes('tagline')) {
          nameEntry.tagline = line.replace(/^[\w\s]+:\s*/i, '').trim();
        } else if (lowerLine.includes('domain')) {
          nameEntry.domainStyle = line.replace(/^[\w\s]+:\s*/i, '').trim();
        }
      }
      
      if (nameEntry.name) {
        names.push(nameEntry);
      }
    }
  }
  
  // If parsing failed, return raw text
  if (names.length === 0) {
    return [{
      name: 'Generated Name',
      meaning: rawText.substring(0, 150),
      positioning: 'See details above',
      tagline: 'Your tagline here',
      domainStyle: '.com'
    }];
  }
  
  return names;
};

/**
 * Generate Business Plan
 * POST /api/ai/business-plan-generator
 */
exports.generateBusinessPlan = async (req, res) => {
  try {
    const { businessName, industry, location, fundingRequired, targetMarket, revenueModel, businessDescription } = req.body;

    // Validate required inputs
    if (!businessName || businessName.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Business name is required' 
      });
    }

    if (!industry || industry.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Industry is required' 
      });
    }

    if (!location || location.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Location is required' 
      });
    }

    if (!fundingRequired || fundingRequired.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Funding required is required' 
      });
    }

    if (!targetMarket || targetMarket.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Target market is required' 
      });
    }

    if (!businessDescription || businessDescription.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Business description is required' 
      });
    }

    // Build prompt for business plan generation
    const prompt = `You are an expert business consultant and startup advisor. Generate a comprehensive business plan for the following venture:

BUSINESS NAME: ${businessName}
INDUSTRY: ${industry}
LOCATION: ${location}
FUNDING REQUIRED: ${fundingRequired}
TARGET MARKET: ${targetMarket}
REVENUE MODEL: ${revenueModel || 'To be defined'}
BUSINESS DESCRIPTION: ${businessDescription}

Generate a complete business plan with the following sections:

1. EXECUTIVE SUMMARY
- Business overview
- Mission and vision
- Key objectives
- Funding ask

2. PROBLEM STATEMENT
- The problem being solved
- Pain points for customers
- Current solutions and gaps

3. SOLUTION
- Product/service description
- Unique value proposition
- How it solves the problem
- Key features and benefits

4. MARKET OPPORTUNITY
- Total addressable market (TAM)
- Serviceable available market (SAM)
- Serviceable obtainable market (SOM)
- Market trends and growth potential
- Target customer segments

5. COMPETITIVE ANALYSIS
- Major competitors
- Competitive advantages
- Market positioning
- Barriers to entry
- SWOT analysis

6. REVENUE MODEL
- Primary revenue streams
- Pricing strategy
- Unit economics
- Revenue projections (3-5 years)

7. MARKETING STRATEGY
- Customer acquisition channels
- Marketing budget allocation
- Growth hacking strategies
- Brand positioning
- Sales funnel

8. OPERATIONAL PLAN
- Day-to-day operations
- Key partnerships
- Technology infrastructure
- Team structure (initial hires)
- Milestones and timeline

9. FINANCIAL PROJECTION OVERVIEW
- Startup costs
- Monthly burn rate
- Break-even analysis
- 3-year financial projections
- Key financial metrics

10. FUNDING BREAKDOWN
- Use of funds
- Allocation by category
- Expected ROI
- Exit strategy

11. CONCLUSION
- Summary of opportunity
- Call to action for investors
- Next steps

Format with clear headings, bullet points, and tables where appropriate. Be specific with numbers and timelines.`;

    const businessPlan = await callHuggingFaceAPI(prompt);

    res.json({
      success: true,
      data: {
        businessPlan: businessPlan.trim(),
        metadata: {
          businessName,
          industry,
          location,
          fundingRequired,
          targetMarket,
          revenueModel,
          businessDescription
        }
      }
    });

  } catch (error) {
    console.error('Business Plan Generator Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate business plan'
    });
  }
};

/**
 * Generate Business Plan as PDF
 * POST /api/ai/business-plan-pdf
 */
exports.generateBusinessPlanPDF = async (req, res) => {
  try {
    const { businessPlan, businessName } = req.body;

    if (!businessPlan) {
      return res.status(400).json({ 
        success: false, 
        error: 'Business plan content is required' 
      });
    }

    res.json({
      success: true,
      data: {
        content: businessPlan,
        fileName: `${businessName || 'business-plan'}-${new Date().toISOString().split('T')[0]}.txt`
      }
    });

  } catch (error) {
    console.error('Business Plan PDF Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to prepare business plan for PDF'
    });
  }
};
