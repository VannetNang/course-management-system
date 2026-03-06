import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { redisCache } from '../utils/redisCache';

// @desc    get each course’s revenue   (ADMIN ONLY)
// @Route   GET   /api/sales
export const getSales = async (
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
              select: { priceAtSale: true },
            },
          },
        });

        return courses.map((course) => {
          const totalEnrolments = course.enrolments.length;
          const totalIncome = course.enrolments.reduce(
            (sum, enc) => sum + Number(enc.priceAtSale),
            0,
          );

          return {
            id: course.id,
            title: course.title,
            thumbnail: course.thumbnail,
            totalEnrolments,
            totalIncome,
          };
        });
      },
      21600 // 6 hours in seconds
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
