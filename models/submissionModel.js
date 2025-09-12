import mongoose from 'mongoose';

const SubmissionSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientNotes: { type: String },
  adminNotes: { type: String },
  originalImageUrl: { type: String, required: true },
  annotatedImageUrl: { type: String },
  pdfReportUrl: { type: String },
  status: { type: String, enum: ['pending', 'reviewed'], default: 'pending' },

}, { timestamps: true });

const Submission = mongoose.model('Submission', SubmissionSchema);
export default Submission;