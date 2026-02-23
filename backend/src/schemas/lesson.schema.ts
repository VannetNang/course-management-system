import * as z from 'zod';

export const createLessonSchema = z.object({
  title: z.string().min(3, 'Course title must be at least 3 characters'),
  description: z.string().optional(),
  videoUrl: z.string().url('Please provide a valid video link'),
});
