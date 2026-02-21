import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';

const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle Prisma Specific Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002: Unique constraint failed (Replacement for Mongoose 11000)
    if (err.code === 'P2002') {
      const field = (err.meta?.target as string[])?.join(', ') || 'field';
      message = `Duplicate field value entered: ${field}`;
      statusCode = 400;
    }

    // P2025: Record not found (Replacement for Mongoose CastError/404)
    if (err.code === 'P2025') {
      message = 'Resource not found!';
      statusCode = 404;
    }

    // P2003: Foreign key constraint failed
    if (err.code === 'P2003') {
      message = 'Foreign key constraint failed. Invalid reference.';
      statusCode = 400;
    }
  }

  // Handle Prisma Validation Errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    message = 'Invalid data provided to the database';
    statusCode = 400;
  }

  console.error(`[Error] ${message}`);

  res.status(statusCode).json({
    status: 'error',
    message: message,
  });
};

export default errorMiddleware;
