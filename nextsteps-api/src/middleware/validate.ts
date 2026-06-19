import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';

export const validateParams =
  <T>(schema: ZodSchema<T>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      res.status(400).json({
        error: 'Invalid request parameters',
        details: result.error.flatten().fieldErrors,
      });
      return;
    }

    req.params = result.data as unknown as Request['params'];
    next();
  };
