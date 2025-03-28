const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");

const chatbotRoutes = require('./routes/chatbotRoutes.js');
const analyticsRoutes = require('./routes/analyticsRoutes.js');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.use("/api/chatbot", chatbotRoutes);
app.use("/api/analytics", analyticsRoutes);

// MongoDB Connection
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error('MongoDB URI is missing in .env file');
  process.exit(1); // Exit process if no URI is found
}

// Removed deprecated options useNewUrlParser and useUnifiedTopology
mongoose.connect(mongoUri)
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB Connection Error:', err));

// Simple Route
app.get('/', (req, res) => {
    res.send('Backend is running...');
});

// Server Port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});