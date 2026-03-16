import { Router } from 'express';
import { destroy, store, update } from '../controllers/lesson.controller';
import { validateBody } from '../middleware/validation.middleware';
import { userAuthorize } from '../middleware/auth.middleware';
import { adminOnly } from '../middleware/role.middleware';
import { upload } from '../middleware/multer.middleware';
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
  upload.single('video'),
  validateBody(createLessonSchema),
  store,
);

// Update specific lesson + Admin only
lessonRouter.put(
  '/:id',
  userAuthorize,
  adminOnly,
  upload.single('video'),
  validateBody(updateLessonSchema),
  update,
);

// Delete specific lesson + Admin only
lessonRouter.delete(
  '/:id',
  userAuthorize,
  adminOnly,
  validateBody(lessonParamSchema),
  destroy,
);

export default lessonRouter;
