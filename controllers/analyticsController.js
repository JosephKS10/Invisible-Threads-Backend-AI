const mongoose =  require('mongoose');
const Analytics = require("../models/Analytics.js");

exports.saveUserResponse = async (userMessage, chatbotReply, sentiment) => {
    try {
        // Validate input with more detailed checks
        if (!userMessage || !chatbotReply || userMessage.trim() === '' || chatbotReply.trim() === '') {
            console.warn("Incomplete or empty data. Skipping save.");
            return null;
        }

        // Truncate messages if they're too long
        const truncatedUserMessage = userMessage.length > 1000 
            ? userMessage.substring(0, 1000) 
            : userMessage;
        
        const truncatedChatbotReply = chatbotReply.length > 1000 
            ? chatbotReply.substring(0, 1000) 
            : chatbotReply;

        const newResponse = new Analytics({ 
            userMessage: truncatedUserMessage, 
            chatbotReply: truncatedChatbotReply, 
            sentiment,
            timestamp: new Date() 
        });

        const savedResponse = await newResponse.save();
        console.log("User response saved successfully.");
        return savedResponse;
    } catch (error) {
        console.error("Error saving response:", error);
        
        // Detailed error logging
        if (error.name === 'ValidationError') {
            console.error("Validation Error Details:", 
                Object.values(error.errors).map(err => err.message)
            );
        }

        return null;
    }
};

exports.getAnalytics = async (req, res) => {
    try {
        // Pagination support
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const skip = (page - 1) * limit;

        // Fetch total count for pagination metadata
        const totalCount = await Analytics.countDocuments();

        const data = await Analytics.find()
            .sort({ timestamp: -1 }) // Sort by most recent first
            .skip(skip)
            .limit(limit)
            .select('-__v'); // Exclude version key

        res.json({
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page,
            data
        });
    } catch (error) {
        console.error("Analytics Fetch Error:", error);
        res.status(500).json({ 
            error: "Error fetching analytics data.",
            details: error.message 
        });
    }
};

exports.getAnalyticsSummary = async (req, res) => {
    try {
        const summary = await Analytics.aggregate([
            {
                $group: {
                    _id: null,
                    totalInteractions: { $sum: 1 },
                    positiveSentiments: { 
                        $sum: { $cond: [{ $eq: ['$sentiment.label', 'positive'] }, 1, 0] } 
                    },
                    negativeSentiments: { 
                        $sum: { $cond: [{ $eq: ['$sentiment.label', 'negative'] }, 1, 0] } 
                    },
                    neutralSentiments: { 
                        $sum: { $cond: [{ $eq: ['$sentiment.label', 'neutral'] }, 1, 0] } 
                    }
                }
            }
        ]);

        res.json(summary[0] || { 
            totalInteractions: 0, 
            positiveSentiments: 0, 
            negativeSentiments: 0,
            neutralSentiments: 0 
        });
    } catch (error) {
        console.error("Analytics Summary Error:", error);
        res.status(500).json({ 
            error: "Error generating analytics summary.",
            details: error.message 
        });
    }
};

