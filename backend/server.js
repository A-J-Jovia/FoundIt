const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Configure CORS
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware - Increase payload limit for base64 images
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Increased from default 100kb
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Routes
app.use('/api/users', require('./routes/authRoutes'));
app.use('/api/items', require('./routes/itemRoutes'));
app.use('/api/ai',    require('./routes/aiRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Digital Lost and Found API is running...');
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const { pool } = require('./db');

process.on('SIGINT', async () => {
  await pool.end();
  console.log('PostgreSQL pool closed.');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await pool.end();
  console.log('PostgreSQL pool closed.');
  process.exit(0);
});
