const mongoose = require('mongoose');

module.exports = async function connectDB() {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    console.error('Check the MONGO_URI environment variable in your deployment settings.');
    process.exit(1);
  }
};