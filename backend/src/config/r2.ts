import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import config from './config';

export const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${config.r2_account_id}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: config.r2_access_key_id,
    secretAccessKey: config.r2_secret_access_key,
  },
});

export const uploadToR2 = async (file: Express.Multer.File) => {
  try {
    const fileName = `lessons/${Date.now()}-${file.originalname}`;

    // Send to R2 Bucket
    await s3.send(
      new PutObjectCommand({
        Bucket: config.r2_bucket_name,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    // Then, generate video url for that file
    const fileUrl = `${config.r2_public_url}/${fileName}`;

    return { fileUrl };
  } catch (error) {
    console.error('R2 Upload Error:', error);
    throw new Error('Failed to upload video to storage');
  }
};
