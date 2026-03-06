import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { redisCache } from '../utils/redisCache';

// @desc    get all courses   (PUBLIC)
// @Route   GET   /api/analytics/stats
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
          totalEnrollments: courses,
        };
      },
      1800, // 30-minute cache
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
