import { Router } from 'express';
import { register, login } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validation.middleware';
import { loginSchema, registerSchema } from '../schemas/auth.schema';

const authRouter = Router();

// User register
authRouter.post('/register', validateRequest(registerSchema), register);

// User login
authRouter.post('/login', validateRequest(loginSchema), login);

export default authRouter;
