import { Request, Response, NextFunction } from 'express';

interface RequestWithUser extends Request {
  user?: any;
}

export const adminOnly = (
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
) => {
  // Double check that userAuthorize was called first
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Unauthorized: No user found',
    });
  }

  // Check if the role is exactly 'admin'
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Forbidden: You do not have permission to access this route',
    });
  }

  // If they are an Admin, let them pass
  next();
};
