require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/error');

if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  console.error('Missing MONGO_URI or JWT_SECRET. Set both as environment variables before starting the server.');
  process.exit(1);
}

const app = express();
const frontendDir = path.join(__dirname, '..', 'frontend');

app.use(
  helmet({
    contentSecurityPolicy: { useDefaults: true, directives: { 'upgrade-insecure-requests': null } },
  })
);
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// API routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/public', require('./routes/publicRoutes'));
app.use('/api/progress', require('./routes/progressRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api', require('./routes/dashboardRoutes'));
app.use('/api', require('./routes/resourceRoutes'));
app.use('/api', notFound);

// Frontend
app.use(express.static(frontendDir));
app.get('/u/:username', (req, res) => res.sendFile(path.join(frontendDir, 'portfolio.html')));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
});