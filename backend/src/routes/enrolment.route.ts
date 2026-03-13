import { Router } from 'express';
import {
  cancelTransaction,
  createTransaction,
  getSummary,
  modifyTransaction,
} from '../controllers/enrolment.controller';
import { userAuthorize } from '../middleware/auth.middleware';
import { validateBody, validateParam } from '../middleware/validation.middleware';
import {
  courseParamSchema,
  enrolmentParamSchema,
  modifyTransactionSchema,
} from '../schemas/enrolment.schema';

const enrolmentRouter = Router();

// Generate course's cost summary + PUBLIC
enrolmentRouter.get(
  '/summary/:id',
  validateParam(courseParamSchema),
  getSummary,
);

// Generate KHQR QR CODE + Auth Only
enrolmentRouter.get(
  '/checkout/:id',
  userAuthorize,
  validateParam(courseParamSchema),
  createTransaction,
);

// Modify the transaction + Auth Only
enrolmentRouter.post(
  '/checkout',
  userAuthorize,
  validateBody(modifyTransactionSchema),
  modifyTransaction,
);

// Cancel the transaction + Auth Only
enrolmentRouter.patch(
  '/checkout/:id',
  userAuthorize,
  validateParam(enrolmentParamSchema),
  cancelTransaction,
);

export default enrolmentRouter;
