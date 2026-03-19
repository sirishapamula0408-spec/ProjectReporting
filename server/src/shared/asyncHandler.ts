import type { Request, Response, NextFunction } from 'express';

/**
 * Wraps async route handlers to catch errors and pass them to the error handler.
 * Eliminates the need for try/catch in every route.
 *
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }));
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
