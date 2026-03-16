import * as z from 'zod';

export const createLessonSchema = z.object({
  title: z.string().min(3, 'Course title must be at least 3 characters'),
  description: z.string().optional(),
});

export const updateLessonSchema = z.object({
  title: z
    .string()
    .min(3, 'Lesson title must be at least 3 characters')
    .optional(),
  description: z.string().optional(),
});

export const lessonParamSchema = z.object({
  id: z.string().uuid('Invalid Lesson ID'),
});
