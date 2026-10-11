import express from 'express';
import { linkedinOAuthService } from '../services/linkedinOAuthService.js';
import { linkedinIntegrationAdapter } from '../services/linkedinIntegrationAdapter.js';
import { logger } from '../utils/logger.js';

export const authRoutes = express.Router();

authRoutes.get('/linkedin/url', (req, res, next) => {
  try {
    const usePkce = process.env.LINKEDIN_USE_PKCE === 'true';
    const url = linkedinOAuthService.getAuthorizationUrl(req.user.id, { usePkce });
    res.json({ url });
  } catch (err) {
    next(err);
  }
});

authRoutes.get('/linkedin/callback', async (req, res, next) => {
  const { state, code, error, error_description } = req.query;
  try {
    if (error) {
      logger.warn('OAuth callback reported error', { error, error_description });
      return res.redirect(`/?oauth=error&message=${encodeURIComponent(error_description || error)}`);
    }

    if (!state || !code) {
      return res.redirect('/?oauth=error&message=Missing+state+or+code');
    }

    await linkedinOAuthService.handleCallback({
      state: String(state),
      code: String(code),
      error: error ? String(error) : null,
      errorDescription: error_description ? String(error_description) : null
    });

    res.redirect('/?oauth=success');
  } catch (err) {
    logger.error('OAuth callback execution error', { message: err.message });
    res.redirect(`/?oauth=error&message=${encodeURIComponent(err.message)}`);
  }
});

authRoutes.get('/linkedin/status', (req, res, next) => {
  try {
    const status = linkedinIntegrationAdapter.getIntegrationStatus(req.user.id);
    res.json(status);
  } catch (err) {
    next(err);
  }
});

authRoutes.post('/linkedin/disconnect', (req, res, next) => {
  try {
    const result = linkedinOAuthService.disconnectAccount(req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
