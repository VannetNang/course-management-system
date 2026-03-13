import { Router } from 'express';
import {
  destroy,
  index,
  show,
  store,
  update,
} from '../controllers/course.controller';
import { userAuthorize } from '../middleware/auth.middleware';
import { adminOnly } from '../middleware/role.middleware';
import { upload } from '../config/cloudinary';
import {
  validateBody,
  validateParam,
} from '../middleware/validation.middleware';
import {
  courseParamSchema,
  createCourseSchema,
  updateCourseSchema,
} from '../schemas/course.schema';

const courseRouter = Router();

// Get all courses + Public
courseRouter.get('/', index);

// Get specific course + Public
courseRouter.get('/:id', validateParam(courseParamSchema), show);

// Create new course + Admin only
courseRouter.post(
  '/',
  userAuthorize,
  adminOnly,
  upload.single('thumbnail'), // must be exact to the Course Schema
  validateBody(createCourseSchema),
  store,
);

// Update specific course + Admin only
courseRouter.put(
  '/:id',
  userAuthorize,
  adminOnly,
  upload.single('thumbnail'), // must be exact to the Course Schema
  validateParam(updateCourseSchema),
  update,
);

// Delete specific course + Admin only
courseRouter.delete(
  '/:id',
  userAuthorize,
  adminOnly,
  validateParam(courseParamSchema),
  destroy,
);

export default courseRouter;
