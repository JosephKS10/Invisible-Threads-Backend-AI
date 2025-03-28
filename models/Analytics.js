const mongoose = require("mongoose");

const AnalyticsSchema = new mongoose.Schema({
    userMessage: { 
        type: String, 
        required: true,
        trim: true,
        maxlength: 1000 // Prevent overly long messages
    },
    chatbotReply: { 
        type: String, 
        required: true,
        trim: true,
        maxlength: 1000 // Prevent overly long replies
    },
    sentiment: { 
        type: {
            score: { 
                type: Number, 
                required: true,
                min: -1,
                max: 1
            },
            label: { 
                type: String, 
                enum: ['positive', 'neutral', 'negative'],
                required: true
            }
        },
        required: true
    },
    timestamp: { 
        type: Date, 
        default: Date.now,
        index: true // Add index for faster sorting and querying
    }
}, { 
    timestamps: true, // Add createdAt and updatedAt fields
    collection: 'analytics' // Explicitly set collection name
});

// Optional: Add text index for searching
AnalyticsSchema.index({ 
    userMessage: 'text', 
    chatbotReply: 'text' 
});

// Optional: Add a method to get recent analytics
AnalyticsSchema.statics.getRecentAnalytics = async function(limit = 100) {
    return this.find()
        .sort({ timestamp: -1 })
        .limit(limit);
};

// Optional: Validation hook
AnalyticsSchema.pre('save', function(next) {
    // Additional validation or data preparation
    if (this.userMessage.length > 1000) {
        this.userMessage = this.userMessage.substring(0, 1000);
    }
    next();
});

module.exports = mongoose.model('Analytics', AnalyticsSchema);