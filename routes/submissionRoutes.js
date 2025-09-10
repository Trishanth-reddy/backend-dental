import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Submission from '../models/submissionModel.js';
import authMiddleware, { adminMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();
const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    const dir = 'uploads/';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_, file, cb) => {
    cb(null, `original-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

// POST /api/submissions: Patient submits image
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { notes } = req.body;
    const patientId = req.user.id;
    if (!req.file) return res.status(400).json({ message: 'Image required' });
    const submission = new Submission({
      patient: patientId,
      patientNotes: notes,
      originalImageUrl: `/uploads/${req.file.filename}`
    });
    await submission.save();
    res.status(201).json(submission);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET /api/submissions/admin: Admin sees all
router.get('/admin', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const submissions = await Submission.find().populate('patient', 'name email patientId').sort({ createdAt: -1 });
    res.json(submissions);
  } catch {
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET /api/submissions/patient: Patient sees own
router.get('/patient', authMiddleware, async (req, res) => {
  try {
    const submissions = await Submission.find({ patient: req.user.id }).sort({ createdAt: -1 });
    res.json(submissions);
  } catch {
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET /api/submissions/:id: View one
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id).populate('patient', 'name email patientId');
    if (!submission) return res.status(404).json({ message: 'Submission not found.' });
    if (req.user.role === 'patient' && submission.patient._id.toString() !== req.user.id)
      return res.status(403).json({ message: 'Access denied.' });
    res.json(submission);
  } catch {
    res.status(500).json({ message: 'Server Error' });
  }
});

// PUT /api/submissions/:id/review: Annotate and save
router.put('/:id/review', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { annotatedImageDataUrl, adminNotes } = req.body;
    const submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ message: 'Submission not found' });
    const base64Data = annotatedImageDataUrl.replace(/^data:image\/png;base64,/, "");
    const fileName = `annotated-${Date.now()}.png`;
    const filePath = `uploads/${fileName}`;
    fs.writeFileSync(filePath, base64Data, 'base64');
    submission.annotatedImageUrl = `/uploads/${fileName}`;
    submission.adminNotes = adminNotes;
    submission.status = 'reviewed';
    await submission.save();
    res.json(submission);
  } catch {
    res.status(500).json({ message: 'Server Error' });
  }
});

export default router;
