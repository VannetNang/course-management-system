import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import config from './config';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${config.r2_account_id}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: config.r2_access_key_id,
    secretAccessKey: config.r2_secret_access_key,
  },
});

export const uploadToR2 = async (file: Express.Multer.File, key: string) => {
  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: config.r2_bucket_name,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );
    return { success: true, key };
  } catch (error) {
    console.error('R2 Upload Error:', error);
    throw new Error('Failed to upload video to storage');
  }
};
