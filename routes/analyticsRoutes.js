const express = require('express');
const { 
    getAnalytics, 
    saveUserResponse,
    getAnalyticsSummary 
} = require('../controllers/analyticsController.js');

// Middleware for input validation
const validateSaveRequest = (req, res, next) => {
    const { userMessage, chatbotReply, sentiment } = req.body;
    
    if (!userMessage || !chatbotReply) {
        return res.status(400).json({ 
            error: 'User message and chatbot reply are required' 
        });
    }

    next();
};

const router = express.Router();

// Route to save user response
router.post("/save", validateSaveRequest, async (req, res) => {
    try {
        const { userMessage, chatbotReply, sentiment } = req.body;
        const savedResponse = await saveUserResponse(
            userMessage, 
            chatbotReply, 
            sentiment
        );

        if (savedResponse) {
            res.status(201).json({ 
                message: 'Response saved successfully',
                data: savedResponse 
            });
        } else {
            res.status(500).json({ 
                error: 'Failed to save response' 
            });
        }
    } catch (error) {
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

// Route to get analytics data with optional pagination
router.get("/data", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;

        const result = await getAnalytics(page, limit);
        res.json(result);
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to retrieve analytics',
            details: error.message 
        });
    }
});

// New route for analytics summary
router.get("/summary", async (req, res) => {
    try {
        const summary = await getAnalyticsSummary();
        res.json(summary);
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to generate analytics summary',
            details: error.message 
        });
    }
});

module.exports = router;