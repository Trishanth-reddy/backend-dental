import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from 'crypto';

// This configuration assumes your .env file has the AWS credentials
const s3Client = new S3Client({
  region: process.env.AWS_BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

/**
 * Uploads a file buffer to AWS S3.
 * @param {Buffer} fileBuffer The file data as a buffer.
 * @param {string} mimeType The MIME type of the file.
 * @returns {Promise<string>} The public URL of the uploaded file.
 */
export const uploadFileToS3 = async (fileBuffer, mimeType) => {
  // Generate a unique file name to prevent overwrites
  const uniqueFileName = crypto.randomBytes(16).toString('hex');
  
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: uniqueFileName,
    Body: fileBuffer,
    ContentType: mimeType,
  });

  await s3Client.send(command);
  
  // Return the full public URL of the file
  return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_BUCKET_REGION}.amazonaws.com/${uniqueFileName}`;
};