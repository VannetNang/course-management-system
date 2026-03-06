import { Router } from 'express';
import { getSales } from '../../controllers/sales.controller';
import { userAuthorize } from '../../middleware/auth.middleware';
import { adminOnly } from '../../middleware/role.middleware';

const salesRouter = Router();

// View all courses revenue income + ADMIN ONLY
salesRouter.get('/', userAuthorize, adminOnly, getSales);

export default salesRouter;
