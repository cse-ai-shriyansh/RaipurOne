const axios = require('axios');

// Multiple Gemini API keys for fallback
const GEMINI_API_KEYS = [
  process.env.GEMINI_API_KEY_1 || process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
].filter(Boolean); // Remove undefined/null values

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

let currentKeyIndex = 0; // Track which API key to use
const keyErrorCounts = {}; // Track errors per key
const KEY_MAX_ERRORS = 3; // Max consecutive errors before switching key
const KEY_COOLDOWN = 60000; // 1 minute cooldown for failed keys

/**
 * Get next available API key with fallback support
 * @returns {string|null} API key or null if none available
 */
function getNextApiKey() {
  if (GEMINI_API_KEYS.length === 0) {
    return null;
  }

  // Try to find a key that hasn't exceeded error limit
  for (let i = 0; i < GEMINI_API_KEYS.length; i++) {
    const keyIndex = (currentKeyIndex + i) % GEMINI_API_KEYS.length;
    const key = GEMINI_API_KEYS[keyIndex];
    const errorCount = keyErrorCounts[key] || 0;

    if (errorCount < KEY_MAX_ERRORS) {
      currentKeyIndex = keyIndex;
      return key;
    }
  }

  // If all keys have errors, reset counters and try again
  console.warn('⚠️ All API keys have errors, resetting error counts');
  Object.keys(keyErrorCounts).forEach(key => {
    keyErrorCounts[key] = 0;
  });
  
  return GEMINI_API_KEYS[0];
}

/**
 * Record API key error
 * @param {string} apiKey - The API key that failed
 */
function recordKeyError(apiKey) {
  if (!keyErrorCounts[apiKey]) {
    keyErrorCounts[apiKey] = 0;
  }
  keyErrorCounts[apiKey]++;
  
  console.warn(`⚠️ API Key ${apiKey.substring(0, 10)}... error count: ${keyErrorCounts[apiKey]}`);
  
  if (keyErrorCounts[apiKey] >= KEY_MAX_ERRORS) {
    console.error(`❌ API Key ${apiKey.substring(0, 10)}... exceeded error limit, switching to next key`);
    currentKeyIndex = (currentKeyIndex + 1) % GEMINI_API_KEYS.length;
    
    // Reset after cooldown
    setTimeout(() => {
      keyErrorCounts[apiKey] = 0;
      console.log(`✅ API Key ${apiKey.substring(0, 10)}... cooldown expired, re-enabled`);
    }, KEY_COOLDOWN);
  }
}

/**
 * Record successful API call
 * @param {string} apiKey - The API key that succeeded
 */
function recordKeySuccess(apiKey) {
  if (keyErrorCounts[apiKey] > 0) {
    keyErrorCounts[apiKey] = Math.max(0, keyErrorCounts[apiKey] - 1);
  }
}

/**
 * Call Gemini API with retry logic and multiple key fallback
 * @param {string} prompt - The prompt to send
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<Object>} Gemini API response
 */
async function callGeminiWithRetry(prompt, maxRetries = 3) {
  let lastError = null;
  let attemptCount = 0;

  for (let retry = 0; retry < maxRetries; retry++) {
    const apiKey = getNextApiKey();
    
    if (!apiKey) {
      throw new Error('No Gemini API keys configured. Please set GEMINI_API_KEY_1, GEMINI_API_KEY_2, and/or GEMINI_API_KEY_3 in .env');
    }

    attemptCount++;
    console.log(`🔄 Attempt ${attemptCount} using API key ${apiKey.substring(0, 10)}...`);

    try {
      const response = await axios.post(
        `${GEMINI_API_URL}?key=${apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      // Success! Record it and return
      recordKeySuccess(apiKey);
      console.log(`✅ API call successful with key ${apiKey.substring(0, 10)}...`);
      return response;

    } catch (error) {
      lastError = error;
      const errorMsg = error.response?.data?.error?.message || error.message;
      const statusCode = error.response?.status;

      console.error(`❌ Attempt ${attemptCount} failed: ${errorMsg}`);

      // Record error for this key
      recordKeyError(apiKey);

      // Don't retry on specific errors
      if (statusCode === 400) {
        console.error('❌ Bad request - not retrying');
        throw error;
      }

      // If this was the last retry, throw the error
      if (retry === maxRetries - 1) {
        throw new Error(`Gemini API failed after ${maxRetries} attempts: ${errorMsg}`);
      }

      // Wait before retry (exponential backoff)
      const waitTime = Math.min(1000 * Math.pow(2, retry), 10000);
      console.log(`⏳ Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw lastError;
}

/**
 * Analyze ticket using Gemini API
 * @param {string} query - The ticket query to analyze
 * @returns {Promise<Object>} Analysis result
 */
async function analyzeTicketWithGemini(query) {

  const prompt = `
You are a smart city civic issue classifier AI. Analyze the citizen query/photo and respond with JSON only.

Query: "${query}"

Classify and provide:
1. requestType: "valid", "invalid", or "garbage"
   - valid: Legitimate complaint needing attention
   - invalid: Unclear or incomplete info
   - garbage: Spam/nonsense

2. department: Choose ONE short name:
   - "General" → general complaints, miscellaneous issues
   - "Plumbing" → water supply, leaks, drainage, sewerage
   - "Electrical" → power outages, streetlights, electrical faults
   - "Roadways" → potholes, road repairs, traffic signals, construction
   - "Cleaning and Sanitation" → garbage collection, waste management, cleanliness
   - "Public Health" → mosquitoes, disease prevention, health hazards, sanitation issues

3. simplifiedSummary: 1-2 sentence summary

4. priority: "low", "medium", "high", or "urgent"
   - urgent: Life-threatening, major failure
   - high: Health hazard, significant impact
   - medium: Needs attention soon
   - low: Minor, can be scheduled

5. confidence: 0-100 confidence score

6. reasoning: Brief classification explanation

7. suggestedActions: Array of 2-3 next steps

RESPOND ONLY WITH VALID JSON - NO MARKDOWN OR EXTRA TEXT.

Example:
{
  "requestType": "valid",
  "department": "Roads",
  "simplifiedSummary": "Multiple potholes on Main Street causing vehicle damage",
  "priority": "high",
  "confidence": 95,
  "reasoning": "Clear road infrastructure issue affecting safety",
  "suggestedActions": ["Inspect road", "Schedule repair", "Post warning signs"]
}
`;

  try {
    console.log(`🤖 Analyzing query: "${query.substring(0, 50)}${query.length > 50 ? '...' : ''}"`);

    const response = await callGeminiWithRetry(prompt);

    // Extract the generated text from Gemini response
    const generatedText = response.data.candidates[0].content.parts[0].text;
    
    // Clean up the response (remove markdown code blocks if present)
    let cleanedText = generatedText.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/```\n?/g, '');
    }
    
    // Parse the JSON response
    const analysis = JSON.parse(cleanedText);

    // Validate the response structure
    if (!analysis.requestType || !analysis.department || !analysis.simplifiedSummary) {
      throw new Error('Invalid response structure from Gemini API');
    }

    console.log(`✅ Analysis complete: ${analysis.department} (${analysis.priority}) - ${analysis.requestType}`);
    return analysis;

  } catch (error) {
    console.error('❌ Error analyzing with Gemini:', error.message);
    
    // Determine error type for better fallback
    const errorType = error.response?.status === 429 ? 'RATE_LIMIT' : 
                      error.response?.status === 503 ? 'SERVICE_UNAVAILABLE' :
                      error.code === 'ECONNABORTED' ? 'TIMEOUT' :
                      error.message.includes('JSON') ? 'PARSE_ERROR' : 'UNKNOWN';

    console.warn(`⚠️ Error type: ${errorType}, providing fallback response`);
    
    // Return a fallback analysis if API fails
    return {
      requestType: 'valid',
      department: 'general',
      simplifiedSummary: query.length > 100 ? query.substring(0, 97) + '...' : query,
      priority: 'medium',
      confidence: 0,
      reasoning: `Automatic analysis failed (${errorType}). Manual review required.`,
      suggestedActions: [
        'Manual review required', 
        'Verify query content', 
        'Assign to appropriate department'
      ],
      error: error.message,
      fallback: true,
    };
  }
}

/**
 * Batch analyze multiple tickets
 * @param {Array} tickets - Array of ticket objects
 * @returns {Promise<Array>} Array of analysis results
 */
async function batchAnalyzeTickets(tickets) {
  const results = [];
  
  for (const ticket of tickets) {
    try {
      const analysis = await analyzeTicketWithGemini(ticket.query);
      results.push({
        ticketId: ticket.ticketId,
        analysis,
        success: true,
      });
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      results.push({
        ticketId: ticket.ticketId,
        analysis: null,
        success: false,
        error: error.message,
      });
    }
  }
  
  return results;
}

/**
 * Validate worker's submitted work using Gemini AI
 */
async function validateWork({ imageBase64, currentLocation, taskLocation, taskDescription, department }) {
  try {
    const prompt = `You are an AI validator for a civic complaint resolution system. 

TASK DETAILS:
- Department: ${department}
- Description: ${taskDescription}
- Expected Location: ${JSON.stringify(taskLocation)}
- Submitted Location: ${JSON.stringify(currentLocation)}

VALIDATION REQUIREMENTS:
1. Analyze the image to verify it shows work related to: ${taskDescription}
2. Check if the image appears to be taken at the claimed location
3. Verify the work is appropriate for the ${department} department
4. Look for signs of genuine work completion (not stock photos)
5. Check for environmental consistency with the task description

Respond in JSON format:
{
  "isValid": true/false,
  "confidence": 0-100,
  "reason": "Brief explanation",
  "concerns": ["list of any concerns"],
  "recommendation": "approve/reject/review"
}`;

    const apiKey = getNextApiKey();
    if (!apiKey) {
      throw new Error('No Gemini API keys configured');
    }

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: imageBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 1024,
        },
      }
    );

    const resultText = response.data.candidates[0].content.parts[0].text;
    
    // Extract JSON from response
    let cleanedText = resultText.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }
    
    const validation = JSON.parse(cleanedText);

    // Check location distance
    const locationValid = validateLocationProximity(currentLocation, taskLocation);

    recordKeySuccess(apiKey);

    return {
      success: validation.isValid && locationValid,
      confidence: validation.confidence,
      message: validation.isValid && locationValid 
        ? 'Work validated successfully' 
        : validation.reason,
      concerns: validation.concerns,
      recommendation: validation.recommendation,
      locationValid: locationValid,
    };
  } catch (error) {
    console.error('Error in work validation:', error);
    return {
      success: false,
      message: 'Failed to validate work. Please try again.',
      error: error.message,
    };
  }
}

/**
 * Validate location proximity
 */
function validateLocationProximity(currentLocation, taskLocation) {
  if (!currentLocation || !taskLocation) {
    return true; // If no location data, allow (handled elsewhere)
  }

  try {
    let taskLat, taskLon;

    if (typeof taskLocation === 'object') {
      taskLat = parseFloat(taskLocation.latitude);
      taskLon = parseFloat(taskLocation.longitude);
    } else if (typeof taskLocation === 'string') {
      const coords = taskLocation.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
      if (coords) {
        taskLat = parseFloat(coords[1]);
        taskLon = parseFloat(coords[2]);
      }
    }

    if (!taskLat || !taskLon) {
      return true;
    }

    const distance = getDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      taskLat,
      taskLon
    );

    // Allow within 500 meters
    return distance <= 500;
  } catch (error) {
    console.error('Error validating location:', error);
    return true; // Allow on error
  }
}

/**
 * Calculate distance between two coordinates in meters
 */
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c * 1000; // Distance in meters
  return distance;
}

/**
 * Analyze image and extract information
 */
async function analyzeImage(imageBase64, customPrompt = 'Describe this image in detail') {
  try {
    const apiKey = getNextApiKey();
    if (!apiKey) {
      throw new Error('No Gemini API keys configured');
    }

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: customPrompt,
              },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: imageBase64,
                },
              },
            ],
          },
        ],
      }
    );

    recordKeySuccess(apiKey);
    return response.data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
}

module.exports = {
  analyzeTicketWithGemini,
  batchAnalyzeTickets,
  validateWork,
  analyzeImage,
  validateLocationProximity,
  getDistance,
};
