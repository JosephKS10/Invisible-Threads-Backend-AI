let sentimentAnalysis;

// Function to load the model dynamically
const loadModel = async () => {
    const { pipeline } = await import('@xenova/transformers'); // Dynamic ESM import
    sentimentAnalysis = await pipeline('sentiment-analysis');
};

// Load the model
loadModel();

const analyzeSentiment = async (text) => {
    if (!sentimentAnalysis) {
        return { score: 0, label: 'neutral', message: "Model is still loading" };
    }

    if (!text || typeof text !== 'string') {
        return { score: 0, label: 'neutral', message: "Invalid input" };
    }

    try {
        const result = await sentimentAnalysis(text);
        return {
            score: result[0].score,
            label: result[0].label.toLowerCase(),
        };
    } catch (error) {
        console.error("Sentiment analysis error:", error);
        return { score: 0, label: 'neutral', message: "Error in processing" };
    }
};

// Export in CommonJS format
module.exports = { analyzeSentiment };
