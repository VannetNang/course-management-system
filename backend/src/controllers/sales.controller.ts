import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { redisCache } from '../utils/redisCache';

// @desc    get each course’s revenue   (ADMIN ONLY)
// @Route   GET   /api/sales/summary
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
