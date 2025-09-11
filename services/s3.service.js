import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import path from "path";

// S3 Client Setup remains the same
const s3Client = new S3Client({
  region: process.env.AWS_BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

/**
 * Uploads a file to AWS S3 with robust extension handling.
 * @param {object} file - The file object from multer (req.file).
 * @returns {Promise<string>} - The public URL of the uploaded file.
 */
export const uploadFileToS3 = async (file) => {
  const randomHex = crypto.randomBytes(16).toString("hex");

  // --- START: ROBUST EXTENSION LOGIC ---

  // 1. Try to get the extension from the original filename.
  let extension = path.extname(file.originalname);

  // 2. If the filename has no extension, fall back to the mimetype.
  if (!extension) {
    extension = `.${file.mimetype.split("/")[1]}`;
  }

  // --- END: ROBUST EXTENSION LOGIC ---
  
  const uniqueFileName = `${randomHex}${extension}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: uniqueFileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3Client.send(command);

  // Return the full public URL of the file
  return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_BUCKET_REGION}.amazonaws.com/${uniqueFileName}`;
};