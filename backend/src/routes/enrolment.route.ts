import { Router } from 'express';
import {
  cancelTransaction,
  createTransaction,
  getSummary,
  modifyTransaction,
} from '../controllers/enrolment.controller';
import { userAuthorize } from '../middleware/auth.middleware';

const enrolmentRouter = Router();

// Generate course's cost summary + PUBLIC
enrolmentRouter.get('/summary/:id', getSummary);

// Generate KHQR QR CODE + Auth Only
enrolmentRouter.get('/checkout/:id', userAuthorize, createTransaction);

// Modify the transaction + Auth Only
enrolmentRouter.post('/checkout', userAuthorize, modifyTransaction);

// Cancel the transaction + Auth Only
enrolmentRouter.delete('/checkout/:id', userAuthorize, cancelTransaction);

export default enrolmentRouter;
