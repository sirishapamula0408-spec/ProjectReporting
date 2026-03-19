import type { Request, Response, NextFunction } from 'express';
import type { Role } from '@prisma/client';
import { AppError } from '../shared/AppError.js';
import { logger } from '../config/logger.js';

/**
 * Middleware to restrict access to specific roles.
 * Must be used AFTER authenticate middleware.
 *
 * Usage: authorize(['PM', 'BU_HEAD'])
 */
export function authorize(allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role as Role)) {
      logger.warn(
        `Authorization denied: ${req.user.username} (${req.user.role}) attempted to access route requiring ${allowedRoles.join('/')}`,
      );
      return next(
        new AppError(
          403,
          'FORBIDDEN',
          'You do not have permission to access this resource',
        ),
      );
    }

    next();
  };
}
