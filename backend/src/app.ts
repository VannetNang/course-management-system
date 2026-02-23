import express, { Request, Response } from 'express';
import authRouter from './routes/auth.route';
import { connectDB } from './config/db';
import errorMiddleware from './middleware/error.middleware';
import cookieParser from 'cookie-parser';
import courseRouter from './routes/course.route';
import lessonRouter from './routes/lesson.route';
import { connectToCloudinary } from './config/cloudinary';

const app = express();

// Third-party connection
connectDB();
connectToCloudinary();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Default route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to CMS Backend API!' });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/courses', courseRouter);
app.use('/api/lessons', lessonRouter);

// Global error handler (should be after routes)
app.use(errorMiddleware);

export default app;
