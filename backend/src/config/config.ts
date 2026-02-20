import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  database_url: string;
  jwt_secret: string;
  jwt_expire: string;
}

const config: Config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  database_url: process.env.DATABASE_URL || '',
  jwt_secret: process.env.JWT_SECRET || '',
  jwt_expire: process.env.JWT_EXPIRES_IN || '3d',
};

export default config;
