import { CloudinaryStorage, Options } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import { Request } from 'express';
import config from './config';
import multer from 'multer';

export const connectToCloudinary = async () => {
  try {
    await cloudinary.config({
      cloud_name: config.cloudinary_name,
      api_key: config.cloudinary_key,
      api_secret: config.cloudinary_secret,
    });

    console.log('Successfully connected Cloudinary!');
  } catch (error) {
    const errMessage = error instanceof Error && error.message;
    console.error('Error connecting to Cloudinary:', errMessage);
    process.exit(1);
  }
};

const storageOptions: Options = {
  cloudinary: cloudinary,
  params: async (req: Request, file: Express.Multer.File) => {
    return {
      folder: 'cms_course_thumbnails',
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
      public_id: `${Date.now()}-${file.originalname.split('.')[0].replace(/\s+/g, '_')}`,
    };
  },
};

const storage = new CloudinaryStorage(storageOptions);

export const upload = multer({ storage: storage });

export { cloudinary };
