const storiesData = require('../data/stories.json');
const stories = storiesData.stories;

function getMostRelevantStory(question, userMessage, sentiment) {
    // First try to match keywords in the question
    const questionKeywords = extractKeywords(question);
    const messageKeywords = extractKeywords(userMessage);
    
    // Combine all relevant keywords
    const allKeywords = [...questionKeywords, ...messageKeywords];
    
    // Filter stories by keyword matches
    let matchingStories = stories.filter(story => 
        story.keywords.some(keyword => 
            allKeywords.some(k => 
                keyword.toLowerCase().includes(k.toLowerCase())
            )
        )
    );
    
    // If no keyword matches, filter by sentiment
    if (matchingStories.length === 0) {
        const closestSentiments = getClosestSentiment(sentiment.label);
        matchingStories = stories.filter(story => 
            closestSentiments.includes(story.sentiment)
        );
    }
    
    // If still no matches, get random story
    if (matchingStories.length === 0) {
        return stories[Math.floor(Math.random() * stories.length)];
    }
    
    // Return a random story from the matching ones
    return matchingStories[Math.floor(Math.random() * matchingStories.length)];
}

function extractKeywords(text) {
    // Simple keyword extraction
    const commonWords = new Set(['the', 'and', 'but', 'what', 'how', 'why', 'when']);
    return text.toLowerCase()
        .split(/\s+|[,.!?;:]/) // Split on whitespace and punctuation
        .filter(word => word.length > 3 && !commonWords.has(word))
        .map(word => word.replace(/[^a-z]/g, '')) // Remove non-letters
        .filter(word => word.length > 0); // Remove empty strings
}

function getClosestSentiment(sentimentLabel) {
    const sentimentMap = {
        'positive': ['hopeful', 'gratitude', 'healing', 'determination'],
        'negative': ['sadness', 'fear', 'frustration'],
        'neutral': ['resilience', 'transformation', 'redemption']
    };
    return sentimentMap[sentimentLabel] || [];
}

module.exports = {
    getMostRelevantStory
};