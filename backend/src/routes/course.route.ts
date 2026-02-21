import { Router } from 'express';
import {
  destroy,
  index,
  show,
  store,
  update,
} from '../controllers/course.controller';

const courseRouter = Router();

// Get all courses
courseRouter.get('/', index);

// Get specific course
courseRouter.get('/:id', show);

// Create new course
courseRouter.get('/', store);

// Update specific course
courseRouter.get('/:id', update);

// Delete specific course
courseRouter.get('/:id', destroy);

export default courseRouter;
