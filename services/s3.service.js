import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

// S3 Client Setup
const s3Client = new S3Client({
  region: process.env.AWS_BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

/**
 * Uploads a file buffer to AWS S3.
 * @param {Buffer} buffer - The file buffer.
 * @param {string} mimetype - The MIME type of the file (e.g., 'image/png').
 * @returns {Promise<string>} - The public URL of the uploaded file.
 */
export const uploadFileToS3 = async (buffer, mimetype) => {
  const randomHex = crypto.randomBytes(16).toString("hex");

  // FIX: Reliably determine the extension from the MIME type
  // This avoids the error when originalname is not passed.
  const mimeToExt = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'application/pdf': '.pdf',
  };

  const extension = mimeToExt[mimetype] || `.${mimetype.split('/')[1]}`;
  
  if (!extension) {
    throw new Error(`Could not determine file extension for MIME type: ${mimetype}`);
  }

  const uniqueFileName = `${randomHex}${extension}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: uniqueFileName,
    Body: buffer,
    ContentType: mimetype,
  });

  await s3Client.send(command);

  // Return the full public URL of the file
  return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_BUCKET_REGION}.amazonaws.com/${uniqueFileName}`;
};