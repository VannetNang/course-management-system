import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';

// @desc    show course's price summary   (PUBLIC)
// @Route   GET   /api/enrolments/summary/:id
export const getSummary = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.status(200).json({
      status: 'success',
      message: 'Course summary retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    show QR CODE   (AUTH ONLY)
// @Route   GET   /api/enrolments/checkout
export const createTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.status(200).json({
      status: 'success',
      message: 'Course summary retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    modify the payment transaction from user   (AUTH ONLY)
// @Route   POST   /api/enrolments/checkout
export const modifyTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.status(200).json({
      status: 'success',
      message: 'Course summary retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    cancel the transaction   (AUTH ONLY)
// @Route   DELETE   /api/enrolments/checkout/:id
export const cancelTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.status(200).json({
      status: 'success',
      message: 'Enrolment cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
};
