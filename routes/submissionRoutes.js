import express from 'express';
import multer from 'multer';
import { protect, isAdmin } from '../middleware/authMiddleware.js';
import { 
  createSubmission, 
  reviewSubmission, 
  getAdminSubmissions, 
  getSubmissionById,
  getPatientSubmissions
} from '../controllers/submission.controller.js';

const router = express.Router();

// Configure multer to store files in memory as buffers
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Patient Routes
router.post('/', protect, upload.single('image'), createSubmission);
router.get('/patient', protect, getPatientSubmissions);

// Admin Routes
router.get('/admin', protect, isAdmin, getAdminSubmissions);
router.put('/:id/review', protect, isAdmin, reviewSubmission);

// Shared Route
router.get('/:id', protect, getSubmissionById);

export default router;