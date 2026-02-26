import { Router } from 'express';
import { destroy, store, update } from '../controllers/lesson.controller';
import { userAuthorize } from '../middleware/auth.middleware';
import { adminOnly } from '../middleware/role.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import {
  createLessonSchema,
  lessonParamSchema,
  updateLessonSchema,
} from '../schemas/lesson.schema';

const lessonRouter = Router();

// Create new lesson + Admin only
lessonRouter.post(
  '/:id',
  userAuthorize,
  adminOnly,
  validateRequest(createLessonSchema),
  store,
);

// Update specific lesson + Admin only
lessonRouter.put(
  '/:id',
  userAuthorize,
  adminOnly,
  validateRequest(updateLessonSchema),
  update,
);

// Delete specific lesson + Admin only
lessonRouter.delete(
  '/:id',
  userAuthorize,
  adminOnly,
  validateRequest(lessonParamSchema),
  destroy,
);

export default lessonRouter;
