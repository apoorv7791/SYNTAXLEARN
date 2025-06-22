import express from 'express';
const router = express.Router();
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import NodeCache from 'node-cache';

dotenv.config();

// Initialize response cache
const responseCache = new NodeCache({
  stdTTL: 60 * 60, // cache for 1 hour
  checkperiod: 120 // check for expired keys every 2 minutes
});

// Initialize the Google Generative AI with API key
const apiKey = process.env.GEMINI_API_KEY;

// Rate limiter to prevent excessive requests
const geminiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

console.log('Primary API Key available:', !!apiKey);

if (!apiKey) {
  console.error('No Gemini API key is set in environment variables');
}

const genAI = new GoogleGenerativeAI(apiKey);

// Simple test endpoint to verify connectivity
router.get('/test', (req, res) => {
  console.log('Test endpoint called');
  return res.status(200).json({ message: 'Backend server is working!' });
});

// POST route to ask Gemini a question
router.post('/ask', geminiRateLimiter, async (req, res) => {
  try {
    console.log('Received request to /api/gemini/ask');
    console.log('Request body:', req.body);

    const { message } = req.body;

    if (!message) {
      console.log('Error: Message is required');
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!apiKey) {
      console.error('No Gemini API key is set in environment variables');
      return res.status(500).json({ error: 'No API key configured' });
    }

    // Check cache first
    const cachedResponse = responseCache.get(message);
    if (cachedResponse) {
      console.log('Returning cached response for:', message);
      return res.status(200).json({ reply: cachedResponse, source: 'cache' });
    }

    try {
      // Get the generative model (Gemini Pro)
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

      console.log('Sending message to Gemini API:', message);

      // Generate content based on the user's message
      const result = await model.generateContent(message);
      const response = result.response;
      const text = response.text();

      // Cache the response
      responseCache.set(message, text);

      console.log('Received response from Gemini API');

      return res.status(200).json({ reply: text, source: 'gemini_api' });
    } catch (geminiError) {
      console.error('Gemini API specific error:', geminiError);

      // Handle specific quota exceeded errors
      if (geminiError.message.includes('429 Too Many Requests') ||
        geminiError.message.includes('quota')) {

        // Fallback to a mock response
        const mockResponse = {
          'Test connection': 'Connection is working, but API quota is exceeded.',
          'what is thermonucelar physics': 'Thermonuclear physics involves the study of nuclear reactions at extremely high temperatures.',
          'what is a cell': 'A cell is the basic structural and functional unit of life, containing various organelles and genetic material.'
        };

        const fallbackReply = mockResponse[message] || 'I apologize, but I cannot provide a response due to API limitations.';

        return res.status(429).json({
          error: 'API Quota Exceeded',
          reply: fallbackReply,
          message: 'You have reached the maximum number of API requests. A mock response is provided.',
          retryAfter: geminiError.retryDelay || 60 // Default to 1 minute
        });
      }

      return res.status(500).json({
        error: 'Failed to get response from Gemini',
        message: geminiError.message || 'Unknown error with Gemini API'
      });
    }
  } catch (error) {
    console.error('General error in route handler:', error);
    return res.status(500).json({
      error: 'Failed to process request',
      message: error.message || 'Unknown error'
    });
  }
});

export default router;
