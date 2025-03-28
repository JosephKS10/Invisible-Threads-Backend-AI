const natural = require('natural');

// Expanded word lists with more comprehensive sentiment indicators
const sentimentDictionary = {
    positive: [
        "yes", "agree", "understand", "aware", "concerned", "help", 
        "support", "empathy", "compassion", "hope", "care", "solution", 
        "assistance", "progress", "positive", "kind", "supportive"
    ],
    negative: [
        "no", "doubt", "fake", "lie", "not true", "harsh", "difficult", 
        "struggle", "problem", "challenge", "hopeless", "impossible", 
        "frustrated", "angry", "sad", "pain", "hard"
    ],
    neutral: [
        "maybe", "unsure", "idk", "perhaps", "possibly", "potentially", 
        "could be", "might", "unclear", "depends"
    ]
};

// Enhanced sentiment analysis function
const analyzeSentiment = (text) => {
    // Validate input
    if (!text || typeof text !== 'string') {
        return {
            score: 0,
            label: 'neutral'
        };
    }

    // Normalize text
    const normalizedText = text.toLowerCase().trim();
    const words = normalizedText.split(/\s+/);

    // Tokenization and stemming
    const tokenizer = new natural.WordTokenizer();
    const stemmer = natural.PorterStemmer;
    const tokens = tokenizer.tokenize(normalizedText)
        .map(token => stemmer.stem(token));

    // Count sentiment words
    let positiveCount = 0;
    let negativeCount = 0;

    tokens.forEach(token => {
        if (sentimentDictionary.positive.includes(token)) positiveCount++;
        if (sentimentDictionary.negative.includes(token)) negativeCount++;
    });

    // Calculate sentiment score
    const totalSentimentWords = positiveCount + negativeCount;
    let score = totalSentimentWords > 0 
        ? (positiveCount - negativeCount) / totalSentimentWords 
        : 0;

    // Determine label
    let label = 'neutral';
    if (score > 0.2) label = 'positive';
    if (score < -0.2) label = 'negative';

    return {
        score: parseFloat(score.toFixed(2)),
        label: label,
        details: {
            positiveWords: positiveCount,
            negativeWords: negativeCount,
            totalSentimentWords: totalSentimentWords
        }
    };
};

// Additional helper methods
analyzeSentiment.addPositiveWord = (word) => {
    sentimentDictionary.positive.push(word.toLowerCase());
};

analyzeSentiment.addNegativeWord = (word) => {
    sentimentDictionary.negative.push(word.toLowerCase());
};


module.exports = {
    analyzeSentiment
};

