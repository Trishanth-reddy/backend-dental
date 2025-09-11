import Submission from '../models/submissionModel.js';
import { uploadFileToS3 } from '../services/s3.service.js';

/**
 * @desc    Patient creates a new submission by uploading an image
 * @route   POST /api/submissions
 * @access  Private (Patient)
 */
export const createSubmission = async (req, res) => {
  try {
    const { notes } = req.body;
    const patientId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required.' });
    }

    // This is the critical step that must be in your code.
    // It uploads the file to S3 and gets the full URL back.
    const imageUrl = await uploadFileToS3(req.file.buffer, req.file.mimetype);

    // This saves the full S3 URL to your database.
    const submission = new Submission({
      patient: patientId,
      patientNotes: notes,
      originalImageUrl: imageUrl, // Saves the full S3 URL
      status: 'pending',
    });

    await submission.save();
    res.status(201).json(submission);
  } catch (error) {
    console.error('Error creating submission:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * @desc    Admin reviews a submission, uploading annotated image and report
 * @route   PUT /api/submissions/:id/review
 * @access  Private (Admin)
 */
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

    let pdfReportUrl = null;
    if (pdfDataUrl) {
      const pdfBuffer = Buffer.from(pdfDataUrl.replace(/^data:application\/pdf;base64,/, ''), 'base64');
      pdfReportUrl = await uploadFileToS3(pdfBuffer, 'application/pdf');
    }

    submission.adminNotes = adminNotes;
    submission.annotatedImageUrl = annotatedImageUrl;
    submission.pdfReportUrl = pdfReportUrl; // Make sure this is in your schema!
    submission.status = 'reviewed';
    
    await submission.save();
    res.json(submission);

  } catch (error) {
    console.error('Error reviewing submission:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// --- Other controller functions ---
export const getAdminSubmissions = async (req, res) => { /* ... */ };
export const getPatientSubmissions = async (req, res) => { /* ... */ };
export const getSubmissionById = async (req, res) => { /* ... */ };