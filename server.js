import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import submissionRoutes from './routes/submissionRoutes.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(cors({
  origin: "*", // Allow all origins
  methods: "GET,POST,PUT,DELETE",
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => console.error('MongoDB connection error:', err));

app.get('/', (req, res) => res.send('Dental Annotation API is running!'));

app.use('/api/auth', authRoutes);
app.use('/api/submissions', submissionRoutes);

app.listen(PORT, () => 
  console.log(`Server running on http://localhost:${PORT}`)
);
