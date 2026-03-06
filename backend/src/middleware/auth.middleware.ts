import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import config from '../config/config';
import jwt from 'jsonwebtoken';
import { redisCache } from '../utils/redisCache';

export interface RequestWithUser extends Request {
  user?: any;
}

interface DecodedToken {
  id: string;
}

export const userAuthorize = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
) => {
  let token: string | undefined;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.jwt) {
    token = req.cookies.jwt;
  }

  // Check if token exists
  if (!token) {
    return res
      .status(401)
      .json({ status: 'error', message: 'Not authorized, token failed' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, config.jwt_secret) as DecodedToken;

    // Extract user + Use Redis Caching
    const user = await redisCache(
      `user:${decoded.id}`,
      async () =>
        await prisma.user.findUnique({
          where: { id: decoded.id },
          select: { id: true, name: true, email: true, role: true }, // Exclude password
        }),
      300, // 5 minutes
    );

    // If user not found
    if (!user) {
      return res
        .status(401)
        .json({ status: 'error', message: 'User no longer exists' });
    }

    // Grant access
    req.user = user;

    next();
  } catch (error) {
    return res
      .status(401)
      .json({ status: 'error', message: 'Not authorized, token failed' });
  }
};
