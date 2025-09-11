import express from 'express';
import multer from 'multer';
import { protect, isAdmin } from '../middleware/auth.middleware.js';
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

// === PATIENT ROUTES ===
// Upload an image to create a new submission
router.post('/', protect, upload.single('image'), createSubmission);
// Get all submissions for the logged-in patient
router.get('/patient', protect, getPatientSubmissions);


// === ADMIN ROUTES ===
// Get all submissions for the admin dashboard
router.get('/admin', protect, isAdmin, getAdminSubmissions);
// Review a submission, upload annotated image and report
router.put('/:id/review', protect, isAdmin, reviewSubmission);


// === SHARED ROUTE ===
// Get a single submission by its ID (for both patient and admin)
router.get('/:id', protect, getSubmissionById);

export default router;