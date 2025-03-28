const express =  require('express');
const { getChatbotResponse } =  require('../controllers/chatbotController.js');
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
// Middleware for input validation
const validateChatbotRequest = (req, res, next) => {
    const { userMessage } = req.body;
    
    if (!userMessage) {
        return res.status(400).json({ 
            error: 'User message is required' 
        });
    }

    // Optional: Add more sophisticated validation
    if (userMessage.length > 1000) {
        return res.status(400).json({ 
            error: 'Message is too long (max 1000 characters)' 
        });
    }

    // Optional: Basic sanitization
    req.body.userMessage = userMessage.trim();

    next();
};

// Rate limiting middleware (basic example)
const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // limit each IP to 10 requests per windowMs
    message: 'Too many requests, please try again later',
    // store: new RedisStore() // Uncomment if using Redis
  });

const router = express.Router();

// Main chatbot response route
router.post("/respond", 
    validateChatbotRequest,
    limiter, // Apply rate limiting
    async (req, res) => {
        try {
            const { userMessage } = req.body;
            
            const result = await getChatbotResponse(req, res);
            
            // Additional logging or analytics can be added here
            console.log(`Chatbot interaction: ${userMessage.substring(0, 50)}...`);
            
            // If the controller handles the response directly, 
            // this might be redundant
            return res.json(result);
        } catch (error) {
            console.error('Chatbot Route Error:', error);
            res.status(500).json({ 
                error: 'Failed to process chatbot request',
                details: error.message 
            });
        }
});

module.exports = router;