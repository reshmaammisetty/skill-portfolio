const mongoose = require('mongoose');

const defaultMongoUri = 'mongodb://localhost:27017/skill_portfolio';

module.exports = async function connectDB() {
  const mongoUri = process.env.MONGO_URI || defaultMongoUri;

  try {
    const connection = await mongoose.connect(mongoUri);
    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    console.error('Using fallback URI:', mongoUri);
    console.error('If you are using MongoDB Atlas, set a valid MONGO_URI in your .env file.');
    process.exit(1);
  }
};