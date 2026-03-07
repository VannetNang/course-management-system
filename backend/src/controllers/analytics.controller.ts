import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { redisCache } from '../utils/redisCache';

// @desc    get stats analytics (Total Revenue, Total Course Purchased)   (ADMIN ONLY)
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

// @desc    get the top 3 best=selling courses   (ADMIN ONLY)
// @Route   GET   /api/analytics/best-selling
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
