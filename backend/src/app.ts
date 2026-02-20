import express from 'express';
import authRouter from './routes/auth.route';
import { connectDB } from './config/db';
import errorMiddleware from './middleware/error.middleware';
import cookieParser from 'cookie-parser';

const app = express();
connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to CMS Backend API!' });
});

// Routes
app.use('/api/auth', authRouter);

// Global error handler (should be after routes)
app.use(errorMiddleware);

export default app;
