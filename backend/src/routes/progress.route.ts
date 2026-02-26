import { Router } from 'express';
import { update } from '../controllers/progress.controller';
import { userAuthorize } from '../middleware/auth.middleware';

const progressRouter = Router();

// Update progress tracker for users + Auth only
progressRouter.patch('/:id', userAuthorize, update);

export default progressRouter;
