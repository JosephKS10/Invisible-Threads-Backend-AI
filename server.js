const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cron = require('node-cron');
const axios = require('axios');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

app.set('trust proxy', true); 
app.use(cors()); 
app.use(express.json()); 

const sessionStore = MongoStore.create({
  mongoUrl: process.env.MONGO_URI,
  collectionName: 'sessions',
  ttl: 30 * 60 
});

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    secure: process.env.NODE_ENV === 'production', 
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 30 * 60 * 1000 
  }
}));

app.use("/api/chatbot", require('./routes/chatbotRoutes'));
app.use("/api/analytics", require('./routes/analyticsRoutes'));
app.use("/api/conclusion", require('./routes/conclusionRoutes'));

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error('MongoDB URI is missing in .env file');
  process.exit(1);
}

mongoose.connect(mongoUri)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });

app.get('/', (req, res) => {
  res.send('Backend is running...');
});

cron.schedule('*/10 * * * *', async () => {
  try {
    const url = 'https://invisible-threads-backend-ai.onrender.com';
    const response = await axios.get(url);
    console.log(`Pinged server: ${response.status}`);
  } catch (error) {
    console.error('Error pinging server:', error.message);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

