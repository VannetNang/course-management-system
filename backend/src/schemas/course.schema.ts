import * as z from 'zod';

const lessonItemSchema = z.array(
  z.object({
    body: z.object({
      title: z.string().min(3, 'Course title must be at least 3 characters'),
      description: z.string().optional(),
      videoUrl: z.string().url('Please provide a valid video link'),
    }),
  }),
);

export const createCourseSchema = z.object({
  body: z.object({
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
  }),
});

export const updateCourseSchema = z.object({
  body: z.object({
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
  }),
});

export const courseParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Course ID'),
  }),
});
