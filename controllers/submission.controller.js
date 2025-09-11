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

    // 1. Upload the original image buffer from multer to S3
    const imageUrl = await uploadFileToS3(req.file.buffer, req.file.mimetype);

    // 2. Create the submission with the returned S3 URL
    const submission = new Submission({
      patient: patientId,
      patientNotes: notes,
      originalImageUrl: imageUrl,
      status: 'pending', // Use 'pending' as per your schema
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

    // 1. Convert annotated image from base64 to buffer and upload to S3
    const annotatedImageBuffer = Buffer.from(annotatedImageDataUrl.replace(/^data:image\/png;base64,/, ''), 'base64');
    const annotatedImageUrl = await uploadFileToS3(annotatedImageBuffer, 'image/png');

    // 2. (Bonus) Convert PDF from base64 to buffer and upload to S3
    let pdfReportUrl = null;
    if (pdfDataUrl) {
      const pdfBuffer = Buffer.from(pdfDataUrl.replace(/^data:application\/pdf;base64,/, ''), 'base64');
      pdfReportUrl = await uploadFileToS3(pdfBuffer, 'application/pdf');
    }

    // 3. Update submission document with S3 URLs
    submission.adminNotes = adminNotes;
    submission.annotatedImageUrl = annotatedImageUrl;
    if (pdfReportUrl) {
        submission.pdfReportUrl = pdfReportUrl; // Make sure this field exists in your schema
    }
    submission.status = 'reviewed';
    
    await submission.save();
    res.json(submission);

  } catch (error) {
    console.error('Error reviewing submission:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// --- Other controller functions (no S3 logic needed) ---

export const getAdminSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find().populate('patient', 'name email patientId').sort({ createdAt: -1 });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getPatientSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ patient: req.user.id }).sort({ createdAt: -1 });
    res.json(submissions);
  } catch {
    res.status(500).json({ message: 'Server Error' });
  }
};


export const getSubmissionById = async (req, res) => {
    try {
        const submission = await Submission.findById(req.params.id).populate('patient', 'name email patientId');
        if (!submission) return res.status(404).json({ message: 'Submission not found.' });
        if (req.user.role === 'patient' && submission.patient._id.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied.' });
        }
        res.json(submission);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};