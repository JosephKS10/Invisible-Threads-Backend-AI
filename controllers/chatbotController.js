const {getMostRelevantStory} = require('../utils/storyManager');
const { v4: uuidv4 } = require('uuid');
const { analyzeSentiment } = require('../utils/sentimentAnalysis');
const axios = require('axios');
const { saveUserResponse} = require('../controllers/analyticsController');

const getResponseStrategy = (sentiment) => {
    if (sentiment.label === 'positive') return { temperature: 0.7, style: 'empathetic' };
    if (sentiment.label === 'negative') return { temperature: 0.3, style: 'factual' };
    return { temperature: 0.5, style: 'neutral' };
};

exports.getChatbotResponse = async (req, res, currentQuestion) => {
    try {
        const { userMessage, isAffirmative } = req.body; // Client now sends explicit affirmation
        
        // Initialize session
        if (!req.session.conversationId) {
            req.session.conversationId = uuidv4();
            req.session.conversationHistory = [];
        }

        // Analyze sentiment
        const sentiment = await analyzeSentiment(userMessage);
        
        // Determine response strategy
        let aiResponse;
        if (currentQuestion.endsWith('?')) { // Yes/No question
            if (isAffirmative) {
                aiResponse = {
                    prompt: `The user answered YES to: "${currentQuestion}" and shared: "${userMessage}".
                    
                    Respond following these rules:
                    1. DO NOT share any stories
                    2. Acknowledge their experience with empathy
                    3. Ask ONE relevant follow-up question
                    4. Keep response concise (2-3 sentences max)`,
                    temperature: 0.7
                };
            } else {
                const story = getMostRelevantStory(currentQuestion, userMessage, sentiment);
                aiResponse = {
                    prompt: `The user answered NO to: "${currentQuestion}" and said: "${userMessage}". 
                    Their sentiment is ${sentiment.label}.
                    
                    Share this story (Title: ${story.title}):
                    "${story.summary}"
                    
                    Then ask ONE follow-up question that:
                    1. Connects to the story
                    2. Relates to their original response
                    3. Is sensitive to their sentiment`,
                    temperature: 0.5
                };
            }
        } else {
            // For descriptive responses
            const strategy = getResponseStrategy(sentiment);
            aiResponse = {
                prompt: `The user was asked: "${currentQuestion}" and responded: "${userMessage}". 
                Provide a ${strategy.style} response considering their ${sentiment.label} sentiment.`,
                temperature: strategy.temperature
            };
        }

        // Call Groq AI API
        const groqResponse = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions", 
            {
                model: "llama-3.3-70b-versatile",
                messages: [
                    {
                        role: "system", 
                        content: `You discuss hidden homelessness. Rules:
                        1. Only share stories when isAffirmative=false
                        2. For affirmative responses, focus on user's experience
                        3. Always ask relevant follow-up questions`
                    },
                    { role: "user", content: aiResponse.prompt }
                ],
                max_tokens: 250, // Reduced for more concise responses
                temperature: aiResponse.temperature
            },
            {
                headers: { 
                    "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const chatbotReply = groqResponse.data.choices[0].message.content;

        // Save conversation context
        req.session.conversationHistory.push({
            question: currentQuestion,
            userMessage,
            aiResponse: chatbotReply,
            sentiment,
            timestamp: new Date(),
            isAffirmative // Store the affirmation state
        });

        await saveUserResponse(userMessage, chatbotReply, sentiment);

        return { 
            response: chatbotReply, 
            sentiment,
            conversationId: req.session.conversationId
        };

    } catch (error) {
        console.error("Chatbot Response Error:", error);
        throw error;
    }
};