import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { loginSchema } from './validation.js';
import { authenticateUser, getUserById } from './service.js';
import { authenticate } from '../../middleware/authenticate.js';
import { AppError } from '../../shared/AppError.js';
import { logger } from '../../config/logger.js';

const router = Router();

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Rate limiter: max 5 login attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many login attempts. Please try again in 15 minutes.' } },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || req.socket.remoteAddress || 'unknown',
});

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const user = await authenticateUser(input);

    // Session regeneration to prevent session fixation
    req.session.regenerate((regenErr) => {
      if (regenErr) {
        logger.error('Session regenerate error', { error: regenErr.message });
        return next(new AppError(500, 'SESSION_ERROR', 'Failed to create session'));
      }

      // Store user data in new session
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.role = user.role as 'PM' | 'BU_HEAD' | 'CFO';
      req.session.businessUnit = user.businessUnit;
      req.session.displayName = user.displayName;

      // Extend cookie maxAge if "Keep Me Signed In" is checked
      if (input.keepSignedIn && req.session.cookie) {
        req.session.cookie.maxAge = THIRTY_DAYS_MS;
      }

      // Save session before responding
      req.session.save((err) => {
        if (err) {
          logger.error('Session save error', { error: err.message });
          return next(new AppError(500, 'SESSION_ERROR', 'Failed to create session'));
        }
        res.json({ data: user });
      });
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await getUserById(req.user!.id);
    if (!user) {
      throw new AppError(401, 'UNAUTHORIZED', 'User not found or inactive');
    }
    res.json({ data: user });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res, next) => {
  const username = req.session.username || 'unknown';

  req.session.destroy((err) => {
    if (err) {
      logger.error('Session destroy error', { error: err.message });
      return next(new AppError(500, 'SESSION_ERROR', 'Failed to destroy session'));
    }

    res.clearCookie('prt.sid');
    logger.info(`Logout: ${username}`);
    res.json({ data: { message: 'Logged out successfully' } });
  });
});

export default router;
