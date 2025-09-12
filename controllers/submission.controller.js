import Submission from '../models/submissionModel.js';
import { uploadFileToS3 } from '../services/s3.service.js';

// Patient creates a new submission
export const createSubmission = async (req, res) => {
  try {
    const { notes } = req.body;
    const patientId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required.' });
    }

    const imageUrl = await uploadFileToS3(req.file.buffer, req.file.mimetype);

    const submission = new Submission({
      patient: patientId,
      patientNotes: notes,
      originalImageUrl: imageUrl,
      status: 'pending',
    });

    await submission.save();
    res.status(201).json(submission);
  } catch (error) {
    console.error('Error creating submission:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Admin reviews a submission
export const reviewSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes, annotatedImageDataUrl, pdfDataUrl } = req.body;

    const submission = await Submission.findById(id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found.' });
    }

    const annotatedImageBuffer = Buffer.from(annotatedImageDataUrl.replace(/^data:image\/png;base64,/, ''), 'base64');
    const annotatedImageUrl = await uploadFileToS3(annotatedImageBuffer, 'image/png');

    const pdfBuffer = Buffer.from(pdfDataUrl.replace(/^data:application\/pdf;base64,/, ''), 'base64');
    const pdfReportUrl = await uploadFileToS3(pdfBuffer, 'application/pdf');

    submission.adminNotes = adminNotes;
    submission.annotatedImageUrl = annotatedImageUrl;
    submission.pdfReportUrl = pdfReportUrl;
    submission.status = 'reviewed';

    await submission.save();
    res.json(submission);
  } catch (error) {
    console.error('Error reviewing submission:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get all submissions for the logged-in patient
export const getPatientSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ patient: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(submissions);
  } catch (error) {
    console.error('Error fetching patient submissions:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get all submissions for the admin dashboard
export const getAdminSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({}).populate('patient', 'name email patientId').sort({ createdAt: -1 });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get a single submission by its ID
export const getSubmissionById = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id).populate('patient', 'name email patientId phone');
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};