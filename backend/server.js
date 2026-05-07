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

// TEMPORARY SETUP ROUTE - Trigger this once to create DB tables and Admin user
app.get('/api/setup', async (req, res) => {
  try {
    const { pool } = require('./db');
    console.log('Enabling PostGIS extension...');
    await pool.query('CREATE EXTENSION IF NOT EXISTS postgis;');

    const { execSync } = require('child_process');
    execSync('npx drizzle-kit push', { stdio: 'inherit' });
    
    const bcrypt = require('bcryptjs');
    const { drizzle } = require('drizzle-orm/node-postgres');
    const { eq } = require('drizzle-orm');
    const { users } = require('./db/schema');
    
    const db = drizzle(pool);
    const email = 'jovia@gmail.com';
    const password = 'jovia123';
    
    const existingUser = await db.select().from(users).where(eq(users.email, email));
    
    if (existingUser.length > 0) {
      await db.update(users).set({ role: 'admin' }).where(eq(users.email, email));
      return res.send('DB Tables created! User existed and is now an admin.');
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      await db.insert(users).values({
        name: 'Jovia',
        email: email,
        password: hashedPassword,
        role: 'admin'
      });
      return res.send('DB Tables created! New admin user created successfully.');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Setup failed: ' + err.message);
  }
});

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
