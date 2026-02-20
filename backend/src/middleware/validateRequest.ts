import { NextFunction, Request, Response } from 'express';

export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const validated = schema.safeParse(req.body);

    if (!validated.success) {
      const formatted = validated.error.format();

      const flatErrors = Object.values(formatted)
        .flat()
        .filter(Boolean)
        .map((err: any) => err._errors)
        .flat();

      return res.status(400).json({ message: flatErrors });
    }

    next();
  };
};
