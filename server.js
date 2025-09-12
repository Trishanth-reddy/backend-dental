import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes.js';
import submissionRoutes from './routes/submissionRoutes.js';

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}
const app = express();
const PORT = process.env.PORT || 5001;

// CORS configuration to allow your frontend to connect
const corsOptions = {
  origin: [
    'http://localhost:8080', // Your local dev server
    'http://localhost:5173', // Default Vite port
    'https://dental-scribe-app.vercel.app',
    // Add your deployed frontend URL here when you have it
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// Apply CORS middleware BEFORE your routes
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => console.error('MongoDB connection error:', err));

  app.get('/', (req, res) => {
  res.status(200).send('API is running and healthy.');
});
// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/submissions', submissionRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});