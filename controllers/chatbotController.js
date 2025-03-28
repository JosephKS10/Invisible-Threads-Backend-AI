const axios = require("axios");
const { analyzeSentiment } = require("../utils/sentimentAnalysis.js");
const { saveUserResponse } = require("../controllers/analyticsController.js");

exports.getChatbotResponse = async (req, res) => {
    try {
        const { userMessage } = req.body;
        
        // Validate input
        if (!userMessage) {
            return res.status(400).json({ error: "User message is required" });
        }

        // Check for API key
        if (!process.env.GROQ_API_KEY) {
            console.error("Groq API key is missing");
            return res.status(500).json({ error: "Server configuration error" });
        }

        // Perform Sentiment Analysis
        const sentiment = analyzeSentiment(userMessage);

        // Call Groq AI API
        const aiResponse = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions", 
            {
                model: "llama-3.3-70b-versatile",  
                messages: [
                    { 
                        role: "system", 
                        content: "You are a friendly AI chatbot raising awareness about hidden homelessness." 
                    },
                    { role: "user", content: userMessage }
                ],
                max_tokens: 300,  // Optional: Limit response length
                temperature: 0.7  // Optional: Control response creativity
            }, 
            {
                headers: { 
                    "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const chatbotReply = aiResponse.data.choices[0].message.content;

        // Save user response for analytics
        await saveUserResponse(userMessage, chatbotReply, sentiment);

        res.json({ 
            response: chatbotReply, 
            sentiment 
        });

    } catch (error) {
        console.error("Chatbot Response Error:", error);
        
        if (error.response) {
            // Error response from Groq API
            res.status(error.response.status).json({ 
                error: "Error from AI service", 
                details: error.response.data 
            });
        } else if (error.request) {
            // No response received
            res.status(500).json({ error: "No response from AI service" });
        } else {
            // Error in request setup
            res.status(500).json({ error: "Internal server error" });
        }
    }
};