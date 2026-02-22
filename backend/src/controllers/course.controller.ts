import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { cloudinary } from '../config/cloudinary';

// @desc    get all courses   (PUBLIC)
// @Route   GET   /api/courses
export const index = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const courses = await prisma.course.findMany({
      orderBy: { createdAt: 'desc' },
      include: { lessons: true },
    });

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
      include: { lessons: true },
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
    const { id } = req.params as { id: string };

    // find existing course
    const existingCourse = await prisma.course.findUnique({
      where: { id: id },
    });

    // if not found
    if (!existingCourse) {
      return res
        .status(404)
        .json({ status: 'error', message: 'Course not found' });
    }

    // then, extract data
    const { title, description, price, discount, discountQuantity, lessons } =
      req.body;

    // if no file, keep the old one
    const thumbnail = req.file?.path;

    const updatedCourse = await prisma.course.update({
      where: { id: id },
      data: {
        title: title || undefined, // If title is empty, Prisma won't touch the current title
        description: description || undefined,
        price: price ? parseFloat(price) : undefined,
        discount: discount ? parseFloat(discount) : undefined,
        discountQuantity: discountQuantity
          ? parseInt(discountQuantity)
          : undefined,
        thumbnail: thumbnail || undefined,
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Updated course successfully',
      data: updatedCourse,
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
    const { id } = req.params as { id: string };

    // find existing course
    const existingCourse = await prisma.course.findUnique({
      where: { id: id },
    });

    // if not found
    if (!existingCourse) {
      return res
        .status(404)
        .json({ status: 'error', message: 'Course not found' });
    }

    // Delete from Cloudinary (if a thumbnail exists)
    if (existingCourse.thumbnail) {
      try {
        // Extract public_id: "folder/image_name" from the full URL
        const publicId = existingCourse.thumbnail
          .split('/')
          .slice(-2)
          .join('/')
          .split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (cloudinaryError) {
        console.error('Cloudinary delete failed:', cloudinaryError);
        // We continue anyway so the DB record actually gets deleted
      }
    }

    // Cause 'onDelete: Cascade', this automatically deletes all associated lessons!
    await prisma.course.delete({
      where: {
        id: id,
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Deleted course successfully',
    });
  } catch (error) {
    next(error);
  }
};
