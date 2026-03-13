import * as z from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim(),

  email: z
    .string()
    .trim() // Removes accidental spaces
    .min(1, 'Email is required')
    .email('Please enter a valid work email')
    .toLowerCase(),

  password: z
    .string()
    .min(2, 'Password must be at least 2 characters')
    .max(32, 'Password cannot exceed 32 characters'),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim() // Removes accidental spaces
    .min(1, 'Email is required')
    .email('Please enter a valid work email')
    .toLowerCase(),

  password: z.string().min(1, 'Password is required'),
});
