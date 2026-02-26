import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';

// @desc    update lesson progress tracking for users   (AUTH ONLY)
// @Route   PATCH   /api/lessons/progress/:id
export const update = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.status(200).json({
      status: 'success',
      message: 'Marked as completed successfully',
    });
  } catch (error) {
    next(error);
  }
};
