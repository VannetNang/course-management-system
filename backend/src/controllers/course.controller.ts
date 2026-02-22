import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { string } from 'zod';

// @desc    get all courses   (PUBLIC)
// @Route   GET   /api/courses
export const index = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const courses = await prisma.course.findMany();

    res.status(200).json({
      status: 'success',
      message: 'Retrieved courses successfully',
      data: courses,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    get specific courses   (PUBLIC)
// @Route   GET   /api/courses/:id
export const show = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findFirstOrThrow({
      where: {
        id: id as string,
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Retrieved course successfully',
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    create new courses   (ADMIN ONLY)
// @Route   POST   /api/courses
export const store = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { title, description, price, discount, discountQuantity, lessons } =
      req.body;
    const thumbnail = req.file?.path;

    // Convert from stringify / text lessons back to array using Parse()
    let parsedLessons = [];
    if (lessons) {
      parsedLessons = JSON.parse(lessons);
    }

    // Create new course
    const newCourse = await prisma.course.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        thumbnail: thumbnail as string,
        discount: parseFloat(discount || '0'),
        discountQuantity: parseInt(discountQuantity || '0'),
        lessons: {
          create: parsedLessons,
        },
      },
      include: {
        lessons: true,
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'Uploaded course successfully',
      data: newCourse,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    update specific courses   (ADMIN ONLY)
// @Route   PUT   /api/courses/:id
export const update = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.status(201).json({
      status: 'success',
      message: 'Updated course successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    delete courses   (ADMIN ONLY)
// @Route   DEL   /api/courses/:id
export const destroy = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.status(200).json({
      status: 'success',
      message: 'Deleted course successfully',
    });
  } catch (error) {
    next(error);
  }
};
