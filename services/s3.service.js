import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

// S3 Client Setup using environment variables
const s3Client = new S3Client({
  region: process.env.AWS_BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

export const uploadFileToS3 = async (buffer, mimetype) => {
  const randomHex = crypto.randomBytes(16).toString("hex");

  const mimeToExt = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
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

  return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_BUCKET_REGION}.amazonaws.com/${uniqueFileName}`;
};