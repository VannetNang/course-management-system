import * as z from 'zod';

const lessonItemSchema = z.array(
  z.object({
    title: z.string().min(3, 'Course title should be at least 3 characters'),
    description: z.string().optional(),
    videoUrl: z.string().url('Please provide a valid video link'),
  }),
);

export const createCourseSchema = z.object({
  title: z.string().min(1, 'Course title is required'),
  description: z
    .string()
    .min(5, 'Please provide a more detailed description')
    .max(1055, 'Description is too long (maximum 1055 characters'),

  // Coerce converts the string "29.99" from Postman into a real number
  price: z.coerce.number().positive('Price must be a positive number'),

  discount: z.coerce.number().min(0).default(0),
  discountQuantity: z.coerce.number().int().min(0).default(0),

  lessons: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        try {
          return JSON.parse(val);
        } catch (error) {
          return [];
        }
      }
    },
    lessonItemSchema.min(1, 'A course must have at least one lesson'),
  ),
});
