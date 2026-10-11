import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';
import { config } from '../config.js';

export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    const issues = err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
    logger.warn('Validation error', { issues, path: req.path });
    return res.status(400).json({
      error: 'Validation failed',
      details: issues
    });
  }

  logger.error('Unhandled server error', {
    message: err.message,
    path: req.path,
    method: req.method
  });

  const statusCode = err.status || err.statusCode || 500;
  const message = config.nodeEnv === 'production' && statusCode === 500 ? 'Internal server error' : err.message;

  res.status(statusCode).json({
    error: message,
    statusCode
  });
}
