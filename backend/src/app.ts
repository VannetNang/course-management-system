import express, { Request, Response } from 'express';
import { connectToCloudinary } from './config/cloudinary';
import { connectDB } from './config/db';
import errorMiddleware from './middleware/error.middleware';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth.route';
import courseRouter from './routes/course.route';
import lessonRouter from './routes/lesson.route';
import enrolmentRouter from './routes/enrolment.route';
import progressRouter from './routes/progress.route';
import { RequestWithUser, userAuthorize } from './middleware/auth.middleware';
import analyticsRouter from './routes/admin/analytics.route';
import salesRouter from './routes/admin/sales.route';

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

// Get User Info route
app.get('/api/user', userAuthorize, (req: RequestWithUser, res: Response) => {
  return res.status(200).json({
    status: 'success',
    message: 'User info retrieved successfully',
    data: req.user,
  });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/courses', courseRouter);
app.use('/api/lessons/progress', progressRouter);
app.use('/api/lessons', lessonRouter);
app.use('/api/enrolments', enrolmentRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/sales', salesRouter);

// Global error handler (should be after routes)
app.use(errorMiddleware);

export default app;
