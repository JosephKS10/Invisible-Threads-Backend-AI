const express =  require('express');
const { getChatbotResponse } =  require('../controllers/chatbotController.js');
const rateLimit = require('express-rate-limit');


const validateChatbotRequest = (req, res, next) => {
    const { userMessage, currentQuestion } = req.body;
    
    if (!userMessage || !currentQuestion) {
        return res.status(400).json({ 
            error: 'Both user message and current question are required' 
        });
    }

    if (userMessage.length > 1000) {
        return res.status(400).json({ 
            error: 'Message is too long (max 1000 characters)' 
        });
    }

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
    limiter,
    async (req, res) => {
        try {
            const { userMessage, currentQuestion } = req.body;
            const result = await getChatbotResponse(req, res, currentQuestion);
            console.log(`Chatbot interaction: ${currentQuestion.substring(0, 30)}...`);
            return res.json(result);
        } catch (error) {
            console.error('Chatbot Route Error:', error);
            res.status(500).json({ 
                error: 'Failed to process chatbot request',
                details: error.message 
            });
        }
    }
);

module.exports = router;