import { Router } from 'express';
import { register, login } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validateRequest';
import { registerSchema } from '../schemas/auth.schema';

const authRouter = Router();

// User register
authRouter.post('/register', validateRequest(registerSchema), register);

// User login
authRouter.post('/login', login);

export default authRouter;
