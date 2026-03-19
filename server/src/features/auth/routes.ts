import { Router } from 'express';
import { loginSchema } from './validation.js';
import { authenticateUser, getUserById } from './service.js';
import { authenticate } from '../../middleware/authenticate.js';
import { AppError } from '../../shared/AppError.js';
import { logger } from '../../config/logger.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const user = await authenticateUser(input);

    // Store user data in session
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role as 'PM' | 'BU_HEAD' | 'CFO';
    req.session.businessUnit = user.businessUnit;
    req.session.displayName = user.displayName;

    // Save session before responding
    req.session.save((err) => {
      if (err) {
        logger.error('Session save error', { error: err.message });
        return next(new AppError(500, 'SESSION_ERROR', 'Failed to create session'));
      }
      res.json({ data: user });
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
