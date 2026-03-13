import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { cloudinary } from '../config/cloudinary';
import { redis, redisCache } from '../utils/redisCache';

// @desc    get all courses   (PUBLIC)
// @Route   GET   /api/courses
/**
 * @swagger
 *   /api/courses:
 *     get:
 *       summary: Get all courses
 *       tags: [Courses]
 *       responses:
 *         "200":
 *           description: The list of courses
 *           contents:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Course'
 */
export const index = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Implement Redis Caching
    const courses = await redisCache(
      'courses:all',
      async () =>
        await prisma.course.findMany({
          orderBy: { createdAt: 'desc' },
          include: { lessons: true },
        }),
    );

    res.status(200).json({
      status: 'success',
      message: 'Courses retrieved successfully',
      data: courses,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    get specific courses   (PUBLIC)
// @Route   GET   /api/courses/:id
/**
 * @swagger
 *   /api/courses/{id}:
 *     get:
 *       summary: Get a course by ID
 *       tags: [Courses]
 *       parameters:
 *         - in: path
 *           name: id
 *           schema:
 *             type: string
 *           required: true
 *           description: Input the course ID
 *       responses:
 *         "200":
 *           description: Course retrieved successfully
 *           contents:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Course'
 *         "404":
 *           $ref: '#/components/responses/404'
 */
export const show = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // course id
    const { id } = req.params as { id: string };

    // Else, implement Redis Caching
    const course = await redisCache(
      `courses:${id}`,
      async () => {
        return await prisma.course.findUnique({
          where: {
            id: id,
          },
          include: { lessons: true },
        });
      },
      3600,
    );

    if (!course) {
      return res
        .status(404)
        .json({ status: 'error', message: 'Course not found' });
    }

    res.status(200).json({
      status: 'success',
      message: 'Course retrieved successfully',
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    create new courses   (ADMIN ONLY)
// @Route   POST   /api/courses
/**
 * @swagger
 *   /api/courses:
 *     post:
 *       summary: Create a course  (Admin Only)
 *       tags: [Courses]
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           multipart/form-data:
 *             schema:
 *               $ref: '#/components/schemas/Course'
 *       responses:
 *         "400":
 *           $ref: '#/components/responses/400'
 *         "401":
 *           $ref: '#/components/responses/401'
 *         "403":
 *           $ref: '#/components/responses/403'
 *         "201":
 *           description: Course uploaded successfully
 *           contents:
 *             application/json
 */
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

    // Then, delete Redis Caching due to New Data
    await redis.del('courses:all');

    res.status(201).json({
      status: 'success',
      message: 'Course uploaded successfully',
      data: newCourse,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    update specific courses   (ADMIN ONLY)
// @Route   PUT   /api/courses/:id
/**
 * @swagger
 *   /api/courses/{id}:
 *     put:
 *       summary: Update a course (Admin Only)
 *       description: Partially update a course's details. All fields are optional — only the fields provided will be updated. If no new thumbnail is uploaded, the existing one is preserved.
 *       tags: [Courses]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           schema:
 *             type: string
 *           required: true
 *           description: The unique ID of the course to update
 *       requestBody:
 *         required: true
 *         content:
 *           multipart/form-data:
 *             schema:
 *               type: object
 *               properties:
 *                 title:
 *                   type: string
 *                   description: Updated course title (optional — keeps existing if omitted)
 *                 description:
 *                   type: string
 *                   description: Updated course description (optional — keeps existing if omitted)
 *                 price:
 *                   type: number
 *                   format: float
 *                   description: Updated course price in USD (optional — keeps existing if omitted)
 *                 thumbnail:
 *                   type: string
 *                   format: binary
 *                   description: Updated course thumbnail image (optional — keeps existing if omitted)
 *                 discount:
 *                   type: number
 *                   format: float
 *                   description: Updated discounted price (optional)
 *                 discountQuantity:
 *                   type: integer
 *                   description: Updated number of seats eligible for the discount (optional)
 *       responses:
 *         "200":
 *           description: Course updated successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     example: success
 *                   message:
 *                     type: string
 *                     example: Course updated successfully
 *                   data:
 *                     $ref: '#/components/schemas/Course'
 *         "400":
 *           $ref: '#/components/responses/400'
 *         "401":
 *           $ref: '#/components/responses/401'
 *         "403":
 *           $ref: '#/components/responses/403'
 *         "404":
 *           $ref: '#/components/responses/404'
 */
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
    const { title, description, price, discount, discountQuantity } = req.body;

    // if no file, keep the old one
    const thumbnail = req.file?.path;

    const updatedCourse = await prisma.course.update({
      where: { id: id },
      data: {
        title: title || undefined, // If title is empty, Prisma won't touch the current title
        description: description || undefined,
        price: price !== undefined ? parseFloat(price) : undefined,
        discount: discount ? parseFloat(discount) : undefined,
        discountQuantity: discountQuantity
          ? parseInt(discountQuantity)
          : undefined,
        thumbnail: thumbnail || undefined,
      },
    });

    // Then, update Redis Caching
    await redis.del('courses:all');
    await redis.del(`courses:${id}`);

    res.status(200).json({
      status: 'success',
      message: 'Course updated successfully',
      data: updatedCourse,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    delete courses   (ADMIN ONLY)
// @Route   DELETE   /api/courses/:id
/**
 * @swagger
 *   /api/courses/{id}:
 *     delete:
 *       summary: Delete a course  (Admin Only)
 *       tags: [Courses]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           schema:
 *             type: string
 *           required: true
 *           description: Input the course ID
 *       responses:
 *         "400":
 *           $ref: '#/components/responses/400'
 *         "401":
 *           $ref: '#/components/responses/401'
 *         "403":
 *           $ref: '#/components/responses/403'
 *         "404":
 *           $ref: '#/components/responses/404'
 *         "200":
 *           description: Course deleted successfully
 *           contents:
 *             application/json
 */
export const destroy = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // course id
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

    // Then, update Redis Caching
    await redis.del('courses:all');
    await redis.del(`courses:${id}`);

    res.status(200).json({
      status: 'success',
      message: 'Course deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
