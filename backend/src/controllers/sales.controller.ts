import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { redisCache } from '../utils/redisCache';

// @desc    get each course's revenue   (ADMIN ONLY)
// @Route   GET   /api/sales/summary
/**
 * @swagger
 * /api/sales/summary:
 *   get:
 *     summary: Get sales summary for all courses (Admin Only)
 *     description: Returns a revenue breakdown for every course including total enrolments, total income, and the list of enrolled students. Results are cached for 1 hour.
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Course income retrieved successfully
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
 *                   example: Course Income retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: clx123abc
 *                       title:
 *                         type: string
 *                         example: Full-Stack Web Development Bootcamp
 *                       thumbnail:
 *                         type: string
 *                         example: uploads/thumbnail.png
 *                       totalEnrolments:
 *                         type: integer
 *                         description: Number of successful enrolments for this course
 *                         example: 42
 *                       totalIncome:
 *                         type: number
 *                         description: Total revenue generated from this course in USD
 *                         example: 839.58
 *                       students:
 *                         type: array
 *                         description: List of students who successfully enrolled
 *                         items:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                               example: Super Boing
 *                             email:
 *                               type: string
 *                               example: boing@example.com
 *       "401":
 *         $ref: '#/components/responses/401'
 *       "403":
 *         $ref: '#/components/responses/403'
 */
export const getSalesSummary = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Wrap the entire logic in redisCache
    const data = await redisCache(
      'admin:course-sales-report',
      async () => {
        const courses = await prisma.course.findMany({
          select: {
            id: true,
            title: true,
            thumbnail: true,
            enrolments: {
              where: { status: 'success' },
              select: {
                priceAtSale: true,
                user: { select: { name: true, email: true } },
              },
            },
          },
        });

        return courses.map((course) => {
          const totalIncome = course.enrolments.reduce(
            (sum, enc) => sum + Number(enc.priceAtSale),
            0,
          );

          return {
            id: course.id,
            title: course.title,
            thumbnail: course.thumbnail,
            totalEnrolments: course.enrolments.length,
            totalIncome,
            students: course.enrolments.map((e) => e.user),
          };
        });
      },
      3600, // in seconds = 1 hour 
    );

    res.status(200).json({
      status: 'success',
      message: 'Course Income retrieved successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};
