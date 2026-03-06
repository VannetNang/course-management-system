import { Router } from 'express';
import { getSalesSummary } from '../../controllers/sales.controller';
import { userAuthorize } from '../../middleware/auth.middleware';
import { adminOnly } from '../../middleware/role.middleware';

const salesRouter = Router();

// View each course’s revenue and a list of enrolled students + ADMIN ONLY
salesRouter.get('/summary', userAuthorize, adminOnly, getSalesSummary);

export default salesRouter;
