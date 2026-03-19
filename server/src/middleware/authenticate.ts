import type { Request, Response, NextFunction } from 'express';
import type { Role } from '@prisma/client';
import { AppError } from '../shared/AppError.js';

// Extend Express Session to include our user data
declare module 'express-session' {
  interface SessionData {
    userId: number;
    username: string;
    role: Role;
    businessUnit: string | null;
    displayName: string;
  }
}

// Extend Express Request to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        role: Role;
        businessUnit: string | null;
        displayName: string;
      };
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  if (!req.session.userId) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
  }

  req.user = {
    id: req.session.userId,
    username: req.session.username!,
    role: req.session.role!,
    businessUnit: req.session.businessUnit ?? null,
    displayName: req.session.displayName!,
  };

  next();
}
