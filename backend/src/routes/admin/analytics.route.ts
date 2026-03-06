import { Router } from 'express';
import { getStats } from '../../controllers/analytics.controller';

const analyticsRouter = Router();

// View all courses revenue income
analyticsRouter.get('/stats', getStats);

export default analyticsRouter;
