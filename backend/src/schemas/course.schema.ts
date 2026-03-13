import * as z from 'zod';

export const createCourseSchema = z.object({
  title: z.string().min(3, 'Course title must be at least 3 characters'),
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
      return typeof val === 'string' ? JSON.parse(val) : val;
    },
    z
      .array(
        z.object({
          title: z.string(),
          description: z.string().optional(),
          videoUrl: z.string().url(),
        }),
      )
      .min(1),
  ),
});

export const updateCourseSchema = z.object({
  title: z
    .string()
    .min(3, 'Course title must be at least 3 characters')
    .optional(),

  description: z
    .string()
    .min(5, 'Please provide a more detailed description')
    .max(1055, 'Description is too long (maximum 1055 characters')
    .optional(),

  // Coerce converts the string "29.99" from Postman into a real number
  price: z.coerce
    .number()
    .positive('Price must be a positive number')
    .optional(),

  discount: z.coerce.number().min(0).optional(),
  discountQuantity: z.coerce.number().int().min(0).optional(),
});

export const courseParamSchema = z.object({
  id: z.string().uuid('Invalid Course ID'),
});
