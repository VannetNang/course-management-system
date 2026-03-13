import { RequestWithUser } from '../middleware/auth.middleware';
import { Response, NextFunction } from 'express';
import { prisma } from '../config/db';

// @desc    create lesson progress tracking for users   (AUTH ONLY)
// @Route   POST   /api/lessons/progress
/**
 * @swagger
 * /api/lessons/progress:
 *   post:
 *     summary: Mark a lesson as completed (Auth Only)
 *     description: Marks a lesson as completed for the authenticated user and automatically recalculates their overall course progress percentage. The user must have a successful enrolment in the course to access this endpoint.
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lessonId
 *               - courseId
 *             properties:
 *               lessonId:
 *                 type: string
 *                 description: The unique ID of the lesson to mark as completed
 *                 example: clx456def
 *               courseId:
 *                 type: string
 *                 description: The unique ID of the course the lesson belongs to
 *                 example: clx123abc
 *     responses:
 *       "200":
 *         description: Lesson marked as completed and progress updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Marked as completed successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     currentProgress:
 *                       type: integer
 *                       description: The user's updated course completion percentage (0–100)
 *                       example: 75
 *       "401":
 *         $ref: '#/components/responses/401'
 *       "403":
 *         description: User has not purchased this course
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: 'Forbidden: You have not purchased this course yet'
 *       "404":
 *         $ref: '#/components/responses/404'
 */
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
    const lesson = await prisma.lesson.findFirst({
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
