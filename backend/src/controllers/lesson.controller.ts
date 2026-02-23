import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';

// @desc    create new lessons   (ADMIN ONLY)
// @Route   POST   /api/lessons/:id
export const store = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params as { id: string };
    const { title, description, videoUrl } = req.body;

    // Find existing course with courseId
    const existingCourse = await prisma.course.findUnique({
      where: {
        id: id,
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
        courseId: id,
        title,
        description,
        videoUrl,
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'Lesson uploaded successfully',
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
    const { id } = req.params as { id: string };
    const { title, description, videoUrl } = req.body;

    // Find existing lesson with lessonId
    const existingLesson = await prisma.lesson.findUnique({
      where: {
        id: id,
      },
    });

    // If not found
    if (!existingLesson) {
      return res.status(404).json({
        status: 'error',
        message: 'Lesson not found',
      });
    }

    // Else, update lesson with new data
    const updatedLesson = await prisma.lesson.update({
      where: { id: id },
      data: {
        title: title || undefined,
        description: description || undefined,
        videoUrl: videoUrl || undefined,
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Lesson updated successfully',
      data: updatedLesson,
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
    const { id } = req.params as { id: string };

    // Find existing lesson with lessonId
    const existingLesson = await prisma.lesson.findUnique({
      where: {
        id: id,
      },
    });

    // If not found
    if (!existingLesson) {
      return res.status(404).json({
        status: 'error',
        message: 'Lesson not found',
      });
    }

    // Else, delete that lesson
    await prisma.lesson.delete({ where: { id: id } });

    res.status(200).json({
      status: 'success',
      message: 'Lesson deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
