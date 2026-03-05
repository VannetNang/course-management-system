import { Router } from 'express';
import {
  register,
  login,
  logout,
  getUser,
} from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validation.middleware';
import { loginSchema, registerSchema } from '../schemas/auth.schema';
import { userAuthorize } from '../middleware/auth.middleware';

const authRouter = Router();

// Get User Info
authRouter.get('/user', userAuthorize, getUser);

// User register
authRouter.post('/register', validateRequest(registerSchema), register);

// User login
authRouter.post('/login', validateRequest(loginSchema), login);

// User logout
authRouter.post('/logout', userAuthorize, logout);

export default authRouter;
