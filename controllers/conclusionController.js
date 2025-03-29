const axios = require('axios');

exports.generateConclusion = async (req, res) => {
    try {
        const { conversationId } = req.body;
        const conversation = req.session.conversationHistory || [];

        // Extract relevant insights
        const insights = conversation.map(c => ({
            question: c.question,
            sentiment: c.sentiment.label
        }));

        // Format insights for AI prompt
        const insightsSummary = insights.map(i => `- ${i.question} (Sentiment: ${i.sentiment})`).join("\n");

        // AI-powered conclusion generation
        const groqResponse = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions", 
            {
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "You are a compassionate AI discussing hidden homelessness." },
                    { 
                        role: "user", 
                        content: `Based on this user's conversation, generate an impactful closing message about hidden homelessness. 
                        Consider the following insights:
                        ${insightsSummary}
                        
                        Then, provide a compelling call-to-action encouraging the user to take action.`
                    }
                ],
                max_tokens: 200,
                temperature: 0.7
            },
            {
                headers: { 
                    "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const aiGeneratedText = groqResponse.data.choices[0].message.content.split("\n");
        
        // Extract conclusion and CTA
        const mainMessage = aiGeneratedText[0] || "You might already know someone who is technically homeless.";
        const callToAction = aiGeneratedText[1] || "Consider volunteering at local shelters or donating to organizations.";

        // Send JSON response
        res.json({
            conversationId,
            mainMessage,
            insights,
            callToAction
        });

    } catch (error) {
        console.error("Conclusion Generation Error:", error);
        res.status(500).json({ error: 'Failed to generate conclusion' });
    }
};
