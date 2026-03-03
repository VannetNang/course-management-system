import { RequestWithUser } from '../middleware/auth.middleware';
import { Response, NextFunction } from 'express';
import { prisma } from '../config/db';

// @desc    create lesson progress tracking for users   (AUTH ONLY)
// @Route   POST   /api/lessons/progress
export const store = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { lessonId, courseId } = req.body;
    const userId = req.user.id;

    // Check if that user already purchased the course
    const enrolment = await prisma.enrolment.findUnique({
      where: {
        userId_courseId: { userId, courseId },
      },
    });

    if (!enrolment || enrolment.status !== 'success') {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden: You have not purchased this course yet',
      });
    }

    // Check if lesson is in that course
    const lesson = await prisma.lesson.findUnique({
      where: {
        id: lessonId,
        courseId: courseId,
      },
    });

    if (!lesson) {
      return res.status(404).json({
        status: 'error',
        message: 'Lesson not found',
      });
    }

    // Else, use transaction to keep the data in sync
    const updatedProgress = await prisma.$transaction(async (tx) => {
      // 1. Insert data to lessonProgress db
      await tx.lessonProgress.upsert({
        where: {
          userId_lessonId: { userId, lessonId },
        },
        update: { isCompleted: true },
        create: {
          userId,
          lessonId,
          isCompleted: true,
        },
      });

      // 2. Get total lessons to calculate %
      const totalLessons = await tx.lesson.count({
        where: { courseId },  // courseId shortcut of courseId = courseId
      });

      // 3. Get completed lessons for this user in THIS course
      const completedCount = await tx.lessonProgress.count({
        where: {
          userId,
          lesson: { courseId }, // Filtering via the Lesson relation
          isCompleted: true,
        },
      });

      // 4. Calculate Percentage
      const percentage =
        totalLessons > 0
          ? Math.round((completedCount / totalLessons) * 100)
          : 0;

      // 5. Update the progress percentage in main Enrolment record
      await tx.enrolment.update({
        where: {
          userId_courseId: { userId, courseId },
        },
        data: {
          progress: percentage,
        },
      });

      return percentage;
    });

    res.status(200).json({
      status: 'success',
      message: 'Marked as completed successfully',
      data: {
        currentProgress: updatedProgress,
      },
    });
  } catch (error) {
    next(error);
  }
};
