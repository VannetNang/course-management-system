import { Response } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/config';

export const generateToken = (userId: string, res: Response): string => {
  const payload = { id: userId };

  const token = jwt.sign(payload, config.jwt_secret as string, {
    expiresIn: config.jwt_expire as any,
  });

  res.cookie('jwt', token, {
    httpOnly: true, // Prevents JavaScript from reading the cookie
    secure: process.env.NODE_ENV === 'production', // Only sends over HTTPS in production
    sameSite: 'strict', // Protects against CSRF attacks
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milli-seconds
  });

  return token;
};
