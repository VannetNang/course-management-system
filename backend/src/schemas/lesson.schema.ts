import * as z from 'zod';

export const createLessonSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Course title must be at least 3 characters'),
    description: z.string().optional(),
    videoUrl: z.string().url('Please provide a valid video link'),
  }),
});

export const updateLessonSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(3, 'Course title must be at least 3 characters')
      .optional(),
    description: z.string().optional(),
    videoUrl: z.string().url('Please provide a valid video link').optional(),
  }),
});

export const lessonParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Lesson ID'),
  }),
});
