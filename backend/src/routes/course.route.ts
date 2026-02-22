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

const courseRouter = Router();

// Get all courses + Public
courseRouter.get('/', index);

// Get specific course + Public
courseRouter.get('/:id', show);

// Create new course + Admin only
courseRouter.post('/', userAuthorize, adminOnly, store);

// Update specific course + Admin only
courseRouter.put('/:id', userAuthorize, adminOnly, update);

// Delete specific course + Admin only
courseRouter.delete('/:id', userAuthorize, adminOnly, destroy);

export default courseRouter;
