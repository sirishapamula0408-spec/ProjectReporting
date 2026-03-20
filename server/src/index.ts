import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { sessionMiddleware } from './config/session.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './config/logger.js';
import authRoutes from './features/auth/routes.js';
import projectRoutes from './features/projects/routes.js';
import milestoneRoutes from './features/milestones/routes.js';
import teamMemberRoutes from './features/team-members/routes.js';
import dashboardRoutes from './features/dashboards/routes.js';
import reviewNoteRoutes from './features/review-notes/routes.js';
import exportRoutes from './features/exports/routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:5173',
    credentials: true,
  }),
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session middleware
app.use(sessionMiddleware);

// Health check (unauthenticated)
app.get('/api/health', (_req, res) => {
  res.json({ data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:id/milestones', milestoneRoutes);
app.use('/api/team-members', teamMemberRoutes);
app.use('/api/dashboards', dashboardRoutes);
app.use('/api/projects/:id/review-notes', reviewNoteRoutes);
app.use('/api/exports', exportRoutes);

// Global error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
