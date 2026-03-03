import { Router } from 'express';
import { store } from '../controllers/progress.controller';
import { userAuthorize } from '../middleware/auth.middleware';

const progressRouter = Router();

// Update progress tracker for users + Auth only
progressRouter.post('/', userAuthorize, store);

export default progressRouter;
