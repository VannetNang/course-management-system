import * as z from 'zod';

export const createTransactionSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Course ID'),
  }),
});

export const modifyTransactionSchema = z.object({
  enrolmentId: z.string().uuid('Invalid Enrolment ID'),
  md5: z.string().min(1, 'md5 is required'),
});
