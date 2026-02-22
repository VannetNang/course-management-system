import { Router } from 'express';
import { destroy, store, update } from '../controllers/lesson.controller';
import { userAuthorize } from '../middleware/auth.middleware';
import { adminOnly } from '../middleware/role.middleware';

const lessonRouter = Router();

// Create new lesson + Admin only
lessonRouter.post('/', userAuthorize, adminOnly, store);

// Update specific lesson + Admin only
lessonRouter.put('/:id', userAuthorize, adminOnly, update);

// Delete specific lesson + Admin only
lessonRouter.delete('/:id', userAuthorize, adminOnly, destroy);

export default lessonRouter;
