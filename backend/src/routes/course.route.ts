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
import { validateRequest } from '../middleware/validation.middleware';
import {
  courseParamSchema,
  createCourseSchema,
  updateCourseSchema,
} from '../schemas/course.schema';

const courseRouter = Router();

// Get all courses + Public
courseRouter.get('/', index);

// Get specific course + Public
courseRouter.get('/:id', validateRequest(courseParamSchema), show);

// Create new course + Admin only
courseRouter.post(
  '/',
  userAuthorize,
  adminOnly,
  upload.single('thumbnail'), // must be exact to the Course Schema
  validateRequest(createCourseSchema),
  store,
);

// Update specific course + Admin only
courseRouter.put(
  '/:id',
  userAuthorize,
  adminOnly,
  upload.single('thumbnail'), // must be exact to the Course Schema
  validateRequest(updateCourseSchema),
  update,
);

// Delete specific course + Admin only
courseRouter.delete(
  '/:id',
  userAuthorize,
  adminOnly,
  validateRequest(courseParamSchema),
  destroy,
);

export default courseRouter;
