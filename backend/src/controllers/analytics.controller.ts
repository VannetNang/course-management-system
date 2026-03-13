import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { redisCache } from '../utils/redisCache';

// @desc    get stats analytics (Total Revenue, Total Course Purchased)   (ADMIN ONLY)
// @Route   GET   /api/analytics/stats
/**
 * @swagger
 * /api/analytics/stats:
 *   get:
 *     summary: Get overall revenue and enrolment stats (Admin Only)
 *     description: Returns the total platform income and total number of successful course purchases. Results are cached for 1 hour.
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Stats retrieved successfully
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
 *                   example: Stats retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalIncome:
 *                       type: number
 *                       description: Total revenue generated across all courses in USD
 *                       example: 4299.75
 *                     totalEnrolments:
 *                       type: integer
 *                       description: Total number of successful course purchases across the platform
 *                       example: 215
 *       "401":
 *         $ref: '#/components/responses/401'
 *       "403":
 *         $ref: '#/components/responses/403'
 */

export const getStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const stats = await redisCache(
      'analytics:revenue',
      async () => {
        // Run both queries in parallel using Promise.all for extra speed!
        const [revenue, courses] = await Promise.all([
          // Revenue Income
          prisma.enrolment.aggregate({
            where: { status: 'success' },
            _sum: { priceAtSale: true },
          }),
          // Total Purchased Course
          prisma.enrolment.count({
            where: { status: 'success' },
          }),
        ]);

        return {
          totalIncome: revenue._sum.priceAtSale || 0,
          totalEnrolments: courses,
        };
      },
      3600, // 60-minute cache
    );

    res.status(200).json({
      status: 'success',
      message: 'Stats retrieved successfully',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};


// @desc    get the top 3 best-selling courses   (ADMIN ONLY)
// @Route   GET   /api/analytics/best-selling
/**
 * @swagger
 * /api/analytics/best-selling:
 *   get:
 *     summary: Get the top 3 best-selling courses (Admin Only)
 *     description: Returns the top 3 courses ranked by number of successful enrolments. Results are cached for 1 hour.
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Top 3 best-selling courses retrieved successfully
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
 *                   example: Top 3 best-selling courses retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                         example: Full-Stack Web Development Bootcamp
 *                       thumbnail:
 *                         type: string
 *                         example: uploads/thumbnail.png
 *       "401":
 *         $ref: '#/components/responses/401'
 *       "403":
 *         $ref: '#/components/responses/403'
 */
export const getBestSelling = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Implement Redis Caching
    const bestSelling = await redisCache(
      'analytics:best-selling',
      async () => {
        const topCourses = await prisma.enrolment.groupBy({
          by: ['courseId'],
          where: { status: 'success' },
          _count: { id: true },
          orderBy: {
            _count: { id: 'desc' }, // Sort by most enrollments
          },
          take: 3, // Only get the top 3
        });

        const courseDetails = await prisma.course.findMany({
          where: { id: { in: topCourses.map((c) => c.courseId) } },
          select: { title: true, thumbnail: true },
        });

        return courseDetails;
      },
      3600,
    );

    res.status(200).json({
      status: 'success',
      message: 'Top 3 best-selling courses retrieved successfully',
      data: bestSelling,
    });
  } catch (error) {
    next(error);
  }
};
