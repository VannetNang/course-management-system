import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';

// @desc    create new lessons   (ADMIN ONLY)
// @Route   POST   /api/lessons
export const store = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { courseId, title, description, videoUrl } = req.body;

    // Find existing course with courseId
    const existingCourse = await prisma.course.findFirstOrThrow({
      where: {
        id: courseId,
      },
    });

    // If not found
    if (!existingCourse) {
      return res.status(404).json({
        status: 'error',
        message: 'Cannot add lesson: Course not found',
      });
    }

    // Else, create new lesson
    const newLesson = await prisma.lesson.create({
      data: {
        courseId: courseId,
        title,
        description,
        videoUrl,
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'Uploaded lesson successfully',
      data: newLesson,
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
