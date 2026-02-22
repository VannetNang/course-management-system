import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  database_url: string;
  jwt_secret: string;
  jwt_expire: string;
  cloudinary_name: string;
  cloudinary_key: string;
  cloudinary_secret: string;
}

const config: Config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  database_url: process.env.DATABASE_URL || '',
  jwt_secret: process.env.JWT_SECRET || '',
  jwt_expire: process.env.JWT_EXPIRES_IN || '3d',
  cloudinary_name: process.env.CLOUDINARY_NAME || '',
  cloudinary_key: process.env.CLOUDINARY_API_KEY || '',
  cloudinary_secret: process.env.CLOUDINARY_API_SECRET || '',
};

export default config;
