import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { s3, uploadToR2 } from '../config/r2';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import config from '../config/config';

// @desc    create new lessons   (ADMIN ONLY)
// @Route   POST   /api/lessons/:id
/**
 * @swagger
 * /api/lessons/{id}:
 *   post:
 *     summary: Add a new lesson to a course (Admin Only)
 *     description: Creates a new lesson and uploads the video to Cloudflare R2 storage. The `id` param refers to the course ID.
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The unique ID of the course to add the lesson to
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - video
 *             properties:
 *               title:
 *                 type: string
 *                 description: The title of the lesson
 *                 example: Introduction to REST APIs
 *               description:
 *                 type: string
 *                 description: A brief overview of what the lesson covers
 *                 example: Fundamentals of REST API design and best practices.
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: The video file to upload to Cloudflare R2
 *     responses:
 *       "201":
 *         description: Lesson uploaded successfully
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
 *                   example: Lesson uploaded successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: clx456def
 *                     title:
 *                       type: string
 *                       example: Introduction to REST APIs
 *                     description:
 *                       type: string
 *                       example: Fundamentals of REST API design and best practices.
 *                     videoUrl:
 *                       type: string
 *                       example: https://pub-xxx.r2.dev/lessons/video.mp4
 *                     courseId:
 *                       type: string
 *                       example: clx123abc
 *       "400":
 *         description: No video file attached
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Please attach a video file for this lesson.
 *       "401":
 *         $ref: '#/components/responses/401'
 *       "403":
 *         $ref: '#/components/responses/403'
 *       "404":
 *         description: Course not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: 'Cannot add lesson: Course not found'
 */
export const store = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params as { id: string };
    const { title, description } = req.body;

    // Find existing course with courseId
    const existingCourse = await prisma.course.findUnique({
      where: {
        id: id,
      },
    });

    // If not found
    if (!existingCourse) {
      return res.status(404).json({
        status: 'error',
        message: 'Cannot add lesson: Course not found',
      });
    }

    // Else, check if video file exists
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'Please attach a video file for this lesson.',
      });
    }

    // Then, upload to R2 Storage
    const result = await uploadToR2(req.file);
    const videoUrl = result.fileUrl;

    // Finally, create new lesson
    const newLesson = await prisma.lesson.create({
      data: {
        courseId: id,
        title,
        description,
        videoUrl,
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'Lesson uploaded successfully',
      data: newLesson,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    update specific lesson   (ADMIN ONLY)
// @Route   PUT   /api/lessons/:id
/**
 * @swagger
 * /api/lessons/{id}:
 *   put:
 *     summary: Update a lesson (Admin Only)
 *     description: Partially updates a lesson. If a new video file is uploaded, it replaces the old one in Cloudflare R2 and the old file is deleted. All fields are optional — only provided fields will be updated.
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The unique ID of the lesson to update
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Updated lesson title (optional — keeps existing if omitted)
 *               description:
 *                 type: string
 *                 description: Updated lesson description (optional — keeps existing if omitted)
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: New video file to replace the existing one in R2 (optional — keeps existing if omitted)
 *     responses:
 *       "200":
 *         description: Lesson updated successfully
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
 *                   example: Lesson updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: clx456def
 *                     title:
 *                       type: string
 *                       example: Introduction to REST APIs
 *                     description:
 *                       type: string
 *                       example: Fundamentals of REST API design and best practices.
 *                     videoUrl:
 *                       type: string
 *                       example: https://pub-xxx.r2.dev/lessons/video.mp4
 *                     courseId:
 *                       type: string
 *                       example: clx123abc
 *       "401":
 *         $ref: '#/components/responses/401'
 *       "403":
 *         $ref: '#/components/responses/403'
 *       "404":
 *         $ref: '#/components/responses/404'
 */
export const update = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params as { id: string };
    const { title, description } = req.body;

    // Find existing lesson with lessonId
    const existingLesson = await prisma.lesson.findUnique({
      where: { id },
    });

    // If not found
    if (!existingLesson) {
      return res.status(404).json({
        status: 'error',
        message: 'Lesson not found',
      });
    }

    // Old video file
    let videoUrl = existingLesson.videoUrl;

    // Else, update lesson with new data if file exists
    if (req.file) {
      // Upload new file
      const { fileUrl } = await uploadToR2(req.file);
      videoUrl = fileUrl;

      // Delete old file from R2 Storage
      if (existingLesson.videoUrl) {
        try {
          const oldKey = decodeURIComponent(
            existingLesson.videoUrl.replace(`${config.r2_public_url}/`, ''),
          );

          await s3.send(
            new DeleteObjectCommand({
              Bucket: config.r2_bucket_name,
              Key: oldKey,
            }),
          );
        } catch (err) {
          console.error('Failed to delete old file:', err);
        }
      }
    }

    // Finally, update DB with whatever we have (new URL or old URL)
    const updatedLesson = await prisma.lesson.update({
      where: { id },
      data: {
        title: title ?? existingLesson.title,
        description: description ?? existingLesson.description,
        videoUrl: videoUrl,
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Lesson updated successfully',
      data: updatedLesson,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    delete lesson   (ADMIN ONLY)
// @Route   DELETE   /api/lessons/:id
/**
 * @swagger
 * /api/lessons/{id}:
 *   delete:
 *     summary: Delete a lesson (Admin Only)
 *     description: Permanently deletes a lesson and its associated video from Cloudflare R2 storage. This action is irreversible.
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The unique ID of the lesson to delete
 *     responses:
 *       "200":
 *         description: Lesson deleted successfully
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
 *                   example: Lesson deleted successfully
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
    // lesson id
    const { id } = req.params as { id: string };

    // Find existing lesson with lessonId
    const existingLesson = await prisma.lesson.findUnique({
      where: {
        id: id,
      },
    });

    // If not found
    if (!existingLesson) {
      return res.status(404).json({
        status: 'error',
        message: 'Lesson not found',
      });
    }

    // Else, delete that lesson
    await prisma.lesson.delete({ where: { id: id } });

    // Also, delete the video
    if (existingLesson.videoUrl) {
      try {
        const oldKey = decodeURIComponent(
          existingLesson.videoUrl.replace(`${config.r2_public_url}/`, ''),
        );

        await s3.send(
          new DeleteObjectCommand({
            Bucket: config.r2_bucket_name,
            Key: oldKey,
          }),
        );
      } catch (err) {
        console.error('Failed to delete old file:', err);
      }
    }

    res.status(200).json({
      status: 'success',
      message: 'Lesson deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
