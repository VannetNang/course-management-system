import { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/db';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/generateToken';

// @desc    create account
// @Route   POST   /api/auth/register
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    // Check if user already exists
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User already exists with this email',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new User
    const newUser = await prisma.user.create({
      data: {
        name,
        password: hashedPassword,
        email,
      },
    });

    // Generate JWT Token
    const token = generateToken(newUser.id, res);

    // Return response
    res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      data: {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    login account
// @Route   POST   /api/auth/login
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    // Check if user exists AND if the password matches
    if (
      !existingUser ||
      !(await bcrypt.compare(password, existingUser.password))
    ) {
      return res.status(401).json({
        status: 'error',
        message: 'Incorrect credential information',
      });
    }

    // Assign JWT Token
    const token = generateToken(existingUser.id, res);

    res.status(200).json({
      status: 'success',
      message: 'Logged in successfully',
      data: {
        user: {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    login account
// @Route   POST   /api/auth/logout
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.cookie('jwt', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only sends over HTTPS in production
      sameSite: 'strict', // Protects against CSRF attacks
      path: '/', // Ensure it clears for the whole domain
      expires: new Date(0), // Set the cookie to expire
    });

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};
