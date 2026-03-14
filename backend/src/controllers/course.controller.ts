import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { cloudinary } from '../config/cloudinary';
import { redis, redisCache } from '../utils/redisCache';

// @desc    get all courses   (PUBLIC)
// @Route   GET   /api/courses
/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Get all courses
 *     description: Returns a list of all courses including their lessons, ordered by most recently created. Results are cached for performance.
 *     tags: [Courses]
 *     responses:
 *       "200":
 *         description: Courses retrieved successfully
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
 *                   example: Courses retrieved successfully
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
 *                       description:
 *                         type: string
 *                         example: A comprehensive full-stack crash course.
 *                       price:
 *                         type: number
 *                         example: 19.99
 *                       thumbnail:
 *                         type: string
 *                         example: uploads/thumbnail.png
 *                       discount:
 *                         type: number
 *                         nullable: true
 *                         example: 14.99
 *                       discountQuantity:
 *                         type: integer
 *                         nullable: true
 *                         example: 50
 *                       lessons:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               example: clx456def
 *                             title:
 *                               type: string
 *                               example: Introduction to REST APIs
 *                             description:
 *                               type: string
 *                               example: Fundamentals of REST API design.
 *                             videoUrl:
 *                               type: string
 *                               example: https://youtube.com/watch?v=example
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
 * /api/courses/{id}:
 *   get:
 *     summary: Get a course by ID
 *     description: Returns a single course with all its lessons. Results are cached for 1 hour.
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The unique ID of the course
 *     responses:
 *       "200":
 *         description: Course retrieved successfully
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
 *                   example: Course retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: clx123abc
 *                     title:
 *                       type: string
 *                       example: Full-Stack Web Development Bootcamp
 *                     description:
 *                       type: string
 *                       example: A comprehensive full-stack crash course.
 *                     price:
 *                       type: number
 *                       example: 19.99
 *                     thumbnail:
 *                       type: string
 *                       example: uploads/thumbnail.png
 *                     discount:
 *                       type: number
 *                       nullable: true
 *                       example: 14.99
 *                     discountQuantity:
 *                       type: integer
 *                       nullable: true
 *                       example: 50
 *                     lessons:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: clx456def
 *                           title:
 *                             type: string
 *                             example: Introduction to REST APIs
 *                           description:
 *                             type: string
 *                             example: Fundamentals of REST API design.
 *                           videoUrl:
 *                             type: string
 *                             example: https://youtube.com/watch?v=example
 *       "404":
 *         $ref: '#/components/responses/404'
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
 * /api/courses:
 *   post:
 *     summary: Create a new course (Admin Only)
 *     description: Creates a new course with lessons. Lessons must be passed as a JSON stringified array in the `lessons` field since the request uses multipart/form-data.
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - price
 *               - thumbnail
 *             properties:
 *               title:
 *                 type: string
 *                 description: The display title of the course
 *                 example: Full-Stack Web Development Bootcamp
 *               description:
 *                 type: string
 *                 description: A detailed description of what students will learn
 *                 example: A comprehensive full-stack crash course from zero to production.
 *               price:
 *                 type: number
 *                 format: float
 *                 minimum: 0.01
 *                 description: The full price of the course in USD (minimum $0.01)
 *                 example: 19.99
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *                 description: The course thumbnail image
 *               lessons:
 *                 type: string
 *                 description: 'A JSON stringified array of lessons e.g: [{"title":"...","description":"...","videoUrl":"..."}]'
 *                 example: '[{"title":"Intro to REST","description":"REST basics","videoUrl":"https://youtube.com/watch?v=example"}]'
 *               discount:
 *                 type: number
 *                 format: float
 *                 minimum: 0.01
 *                 nullable: true
 *                 description: An optional discounted price (minimum $0.01)
 *                 example: 14.99
 *               discountQuantity:
 *                 type: integer
 *                 nullable: true
 *                 description: Number of seats eligible for the discounted price
 *                 example: 50
 *     responses:
 *       "201":
 *         description: Course uploaded successfully
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
 *                   example: Course uploaded successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: clx123abc
 *                     title:
 *                       type: string
 *                       example: Full-Stack Web Development Bootcamp
 *                     price:
 *                       type: number
 *                       example: 19.99
 *                     lessons:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: clx456def
 *                           title:
 *                             type: string
 *                             example: Intro to REST
 *                           videoUrl:
 *                             type: string
 *                             example: https://youtube.com/watch?v=example
 *       "400":
 *         $ref: '#/components/responses/400'
 *       "401":
 *         $ref: '#/components/responses/401'
 *       "403":
 *         $ref: '#/components/responses/403'
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
 * /api/courses/{id}:
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: clx123abc
 *                       title:
 *                         type: string
 *                         example: Full-Stack Web Development Bootcamp
 *                       description:
 *                         type: string
 *                         example: A comprehensive full-stack crash course.
 *                       price:
 *                         type: number
 *                         example: 19.99
 *                       thumbnail:
 *                         type: string
 *                         example: uploads/thumbnail.png
 *                       discount:
 *                         type: number
 *                         nullable: true
 *                         example: 14.99
 *                       discountQuantity:
 *                         type: integer
 *                         nullable: true
 *                         example: 50
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
 * /api/courses/{id}:
 *   delete:
 *     summary: Delete a course (Admin Only)
 *     description: Permanently deletes a course and all its associated lessons. Also removes the thumbnail from Cloudinary. This action is irreversible.
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The unique ID of the course to delete
 *     responses:
 *       "200":
 *         description: Course deleted successfully
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
 *                   example: Course deleted successfully
 *       "401":
 *         $ref: '#/components/responses/401'
 *       "403":
 *         $ref: '#/components/responses/403'
 *       "404":
 *         $ref: '#/components/responses/404'
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
