import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cookieParser from 'cookie-parser';
import { securityHeaders, authMiddleware } from './middleware/authMiddleware.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRoutes } from './routes/authRoutes.js';
import { profileRoutes } from './routes/profileRoutes.js';
import { auditRoutes } from './routes/auditRoutes.js';
import { automationRoutes } from './routes/automationRoutes.js';
import { exportRoutes } from './routes/exportRoutes.js';
import { settingsRoutes } from './routes/settingsRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, '..', 'public');

export function createApp() {
  const app = express();

  app.use(securityHeaders);
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());
  app.use(rateLimiter);
  app.use(authMiddleware);

  app.use(express.static(publicDir));

  app.use('/auth', authRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/audit', auditRoutes);
  app.use('/api/automation', automationRoutes);
  app.use('/api/export', exportRoutes);
  app.use('/api/settings', settingsRoutes);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/privacy', (req, res) => {
    res.sendFile(path.join(publicDir, 'privacy.html'));
  });

  app.use(errorHandler);

  return app;
}

export const app = createApp();
