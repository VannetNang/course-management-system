import { Router } from 'express';
import { getStats, getBestSelling } from '../../controllers/analytics.controller';
import { userAuthorize } from '../../middleware/auth.middleware';
import { adminOnly } from '../../middleware/role.middleware';

const analyticsRouter = Router();

// View all courses revenue income + ADMIN ONLY
analyticsRouter.get('/stats', userAuthorize, adminOnly, getStats);

// View Top 3 best-selling courses + ADMIN ONLY
analyticsRouter.get('/best-selling', userAuthorize, adminOnly, getBestSelling);

export default analyticsRouter;
