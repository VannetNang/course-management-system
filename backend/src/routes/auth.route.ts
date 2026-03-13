import { Router } from 'express';
import { register, login, logout } from '../controllers/auth.controller';
import { validateBody } from '../middleware/validation.middleware';
import { loginSchema, registerSchema } from '../schemas/auth.schema';
import { userAuthorize } from '../middleware/auth.middleware';

const authRouter = Router();

// User register
authRouter.post('/register', validateBody(registerSchema), register);

// User login
authRouter.post('/login', validateBody(loginSchema), login);

// User logout
authRouter.post('/logout', userAuthorize, logout);

export default authRouter;
