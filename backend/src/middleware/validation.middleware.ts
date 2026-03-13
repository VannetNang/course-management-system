import { NextFunction, Request, Response } from 'express';

export const validateBody = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const validated = schema.safeParse(req.body);

    if (!validated.success) {
      const fieldErrors = validated.error.flatten().fieldErrors;

      // Convert that object into a single flat array of strings
      const flatErrors = Object.values(fieldErrors).flat();

      return res.status(400).json({ status: 'error', message: flatErrors });
    }

    next();
  };
};

export const validateParam = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const validated = schema.safeParse(req.params);

    if (!validated.success) {
      const fieldErrors = validated.error.flatten().fieldErrors;

      // Convert that object into a single flat array of strings
      const flatErrors = Object.values(fieldErrors).flat();

      return res.status(400).json({ status: 'error', message: flatErrors });
    }

    next();
  };
};
