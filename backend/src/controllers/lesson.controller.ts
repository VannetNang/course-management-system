import { Request, Response, NextFunction } from 'express';

// @desc    create new lessons   (ADMIN ONLY)
// @Route   POST   /api/lessons
export const store = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.status(201).json({
      status: 'success',
      message: 'Uploaded lesson successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    update specific lesson   (ADMIN ONLY)
// @Route   PUT   /api/lessons/:id
export const update = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.status(200).json({
      status: 'success',
      message: 'Updated lesson successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    delete lesson   (ADMIN ONLY)
// @Route   DELETE   /api/lessons/:id
export const destroy = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.status(200).json({
      status: 'success',
      message: 'Deleted lesson successfully',
    });
  } catch (error) {
    next(error);
  }
};
