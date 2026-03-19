import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

/**
 * Middleware to validate request body against a Zod schema.
 * Throws ZodError on failure (caught by global errorHandler).
 *
 * Usage: router.post('/path', validateRequest(mySchema), handler);
 */
export function validateRequest(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to validate request query params against a Zod schema.
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      next(error);
    }
  };
}
