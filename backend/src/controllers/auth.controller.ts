import { Request, Response } from 'express';
import { prisma } from '../config/db';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/generateToken';

// @desc    create account
// @Route   POST   /api/auth/register
export const register = async (req: Request, res: Response) => {
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
        error: 'User already exists with this email',
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
        },
        token,
      },
    });
  } catch (error) {
    const err =
      error instanceof Error ? error.message : 'Internal Server Error';
    console.error(err);
    res.status(500).json({
      message: err,
    });
  }
};

// @desc    login account
// @Route   POST   /api/auth/login
export const login = async (req: Request, res: Response) => {
  try {
    res.json({ message: 'Success' });
  } catch (error) {
    const err =
      error instanceof Error ? error.message : 'Internal Server Error';
    console.error(err);
    res.status(500).json({
      message: err,
    });
  }
};
