const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_1;
const GEMINI_API_URL = process.env.GEMINI_API_ENDPOINT || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';
const IS_MOCK_MODE = !GEMINI_API_KEY; // Always use real API if key exists

/**
 * Mock transcription for dev environment without API keys
 */
const getMockTranscription = (imageUrl) => {
  return {
    transcription: `[Mock] Image transcription for: ${imageUrl}. This appears to be a municipal complaint with visible infrastructure damage. Potholes and road deterioration are evident.`,
    confidence: 85,
    language: 'en',
    extracted_text: 'Sample extracted text from the image',
    mock: true,
  };
};

/**
 * Mock analysis for dev environment
 */
const getMockAnalysis = (query) => {
  return {
    summary: `[Mock] This ticket appears to be about road maintenance issues. The citizen reports infrastructure problems requiring immediate attention.`,
    details: {
      category: 'Infrastructure',
      urgency: 'Medium',
      department: 'roadway',
      estimated_resolution_time: '3-5 business days',
      suggested_actions: [
        'Dispatch inspection team',
        'Assess damage severity',
        'Schedule repair crew',
      ],
    },
    confidence: 90,
    mock: true,
  };
};

/**
 * Call Gemini API with proper error handling
 * Returns text response from Gemini
 */
async function callGemini(prompt, retries = 2) {
  if (IS_MOCK_MODE) {
    console.log('🧪 Mock mode: Simulating Gemini API call');
    await new Promise(resolve => setTimeout(resolve, 500));
    return null; // Signals to use mock data
  }

  let lastError;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000,
        }
      );

      return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
      lastError = error;
      
      // Don't retry on bad requests
      if (error.response?.status === 400) {
        throw error;
      }
      
      // Wait before retry with exponential backoff
      if (attempt < retries - 1) {
        const waitTime = 1000 * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError;
}

/**
 * Transcribe image endpoint
 * POST /api/gemini/transcribe
 * Body: { imageUrl: string }
 */
async function transcribeImage(req, res) {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'imageUrl is required',
      });
    }

    // Use mock in development without keys
    if (IS_MOCK_MODE) {
      return res.json({
        success: true,
        data: getMockTranscription(imageUrl),
      });
    }

    const prompt = `Analyze this image and extract all visible text. Provide a detailed description of what you see, focusing on any municipal infrastructure issues, damage, or complaints visible in the image.

Image URL: ${imageUrl}

Please provide:
1. All readable text in the image
2. A description of what's shown
3. Any visible issues or problems
4. Estimated severity if applicable

Format as JSON with fields: transcription, extracted_text, description, severity`;

    const geminiResponse = await callGemini(prompt);
    
    if (!geminiResponse) {
      return res.json({
        success: true,
        data: getMockTranscription(imageUrl),
      });
    }

    // Parse Gemini response (remove markdown if present)
    let cleanedText = geminiResponse.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    let parsedData;
    try {
      parsedData = JSON.parse(cleanedText);
    } catch (parseError) {
      // If not JSON, treat entire response as transcription
      parsedData = {
        transcription: geminiResponse,
        extracted_text: '',
        description: geminiResponse,
      };
    }

    res.json({
      success: true,
      data: {
        ...parsedData,
        confidence: parsedData.confidence || 85,
        language: parsedData.language || 'en',
      },
    });

  } catch (error) {
    console.error('❌ Transcription error:', error.message);
    
    // Provide fallback response on error
    res.status(500).json({
      success: false,
      message: 'Transcription failed',
      error: error.message,
      data: getMockTranscription(req.body.imageUrl || ''),
    });
  }
}

/**
 * Analyze ticket endpoint
 * POST /api/gemini/analyze
 * Body: { ticketId: string, query: string }
 */
async function analyzeTicket(req, res) {
  try {
    const { ticketId, query } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'query is required',
      });
    }

    // Use mock in development without keys
    if (IS_MOCK_MODE) {
      return res.json({
        success: true,
        data: getMockAnalysis(query),
      });
    }

    const prompt = `Analyze this citizen complaint and provide a structured response.

Complaint: "${query}"

Provide a JSON response with:
1. summary: A concise 1-2 sentence summary
2. details: An object with:
   - category: The type of complaint (Infrastructure, Sanitation, Water, etc.)
   - urgency: Low, Medium, High, or Critical
   - department: Which department should handle this (roadway, cleaning, drainage, water-supply, general)
   - estimated_resolution_time: Expected time to resolve
   - suggested_actions: Array of 2-3 recommended steps
3. confidence: Your confidence level (0-100)

Respond ONLY with valid JSON, no markdown.`;

    const geminiResponse = await callGemini(prompt);
    
    if (!geminiResponse) {
      return res.json({
        success: true,
        data: getMockAnalysis(query),
      });
    }

    // Parse Gemini response
    let cleanedText = geminiResponse.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/```\n?/g, '');
    }

    const analysis = JSON.parse(cleanedText);

    res.json({
      success: true,
      data: analysis,
    });

  } catch (error) {
    console.error('❌ Analysis error:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Analysis failed',
      error: error.message,
      data: getMockAnalysis(req.body.query || ''),
    });
  }
}

/**
 * Safety check endpoint
 * POST /api/gemini/safety-check
 * Body: { place: string }
 * Returns: { safe_day: boolean, safe_night: boolean, summary: string, recent_incidents: [...], sources: [...] }
 */
async function safetyCheck(req, res) {
  try {
    const { place } = req.body;

    if (!place) {
      return res.status(400).json({ success: false, message: 'place is required' });
    }

    if (IS_MOCK_MODE) {
      return res.json({
        success: true,
        data: {
          safe_day: true,
          safe_night: false,
          summary: `[Mock] ${place}, Chhattisgarh is generally safe during daytime but exercise caution at night. Recent incidents include a robbery reported in local news and a road-side assault.`,
          recent_incidents: [
            { title: 'Robbery near market', date: '2025-10-02', source: 'Local News' },
            { title: 'Assault on roadside', date: '2025-09-15', source: 'Citizen report' },
          ],
          sources: ['https://example.com/local-news-robbery', 'https://example.com/incident-report']
        }
      });
    }

    const prompt = `You are a concise safety analyst. Given a place name in Chhattisgarh, India, answer in strict JSON only with fields: safe_day (true/false), safe_night (true/false), summary (one paragraph), recent_incidents (array of objects with title, date, source), sources (array of URLs).

Place: ${place}, Chhattisgarh, India

Consider recent local news, police reports, and social media complaints. Focus on verifiable incidents and provide sources (URLs) if available. Keep the response short and factual.`;

    const geminiResponse = await callGemini(prompt);

    if (!geminiResponse) {
      return res.json({ success: true, data: getMockAnalysis(place) });
    }

    let cleanedText = geminiResponse.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/```\n?/g, '');
    }

    let parsed;
    try {
      parsed = JSON.parse(cleanedText);
    } catch (err) {
      // If parsing fails, return the raw text as summary
      return res.json({ success: true, data: { summary: geminiResponse } });
    }

    res.json({ success: true, data: parsed });

  } catch (error) {
    console.error('❌ Safety check error:', error.message);
    res.status(500).json({ success: false, message: 'Safety check failed', error: error.message });
  }
}

module.exports = {
  transcribeImage,
  analyzeTicket,
  safetyCheck,
};
