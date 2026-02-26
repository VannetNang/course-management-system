import { Router } from 'express';
import {
  cancelTransaction,
  createTransaction,
  getSummary,
  modifyTransaction,
} from '../controllers/enrolment.controller';
import { userAuthorize } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import {
  courseParamSchema,
  enrolmentParamSchema,
  modifyTransactionSchema,
} from '../schemas/enrolment.schema';

const enrolmentRouter = Router();

// Generate course's cost summary + PUBLIC
enrolmentRouter.get(
  '/summary/:id',
  validateRequest(courseParamSchema),
  getSummary,
);

// Generate KHQR QR CODE + Auth Only
enrolmentRouter.get(
  '/checkout/:id',
  userAuthorize,
  validateRequest(courseParamSchema),
  createTransaction,
);

// Modify the transaction + Auth Only
enrolmentRouter.post(
  '/checkout',
  userAuthorize,
  validateRequest(modifyTransactionSchema),
  modifyTransaction,
);

// Cancel the transaction + Auth Only
enrolmentRouter.patch(
  '/checkout/:id',
  userAuthorize,
  validateRequest(enrolmentParamSchema),
  cancelTransaction,
);

export default enrolmentRouter;
