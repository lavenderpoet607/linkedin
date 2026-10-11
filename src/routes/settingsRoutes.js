import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config.js';
import { automationService } from '../services/automationService.js';
import { linkedinApiService } from '../services/linkedinApiService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');

export const settingsRoutes = express.Router();

settingsRoutes.get('/user', (req, res) => {
  res.json({
    user: req.user,
    sessionId: req.sessionId
  });
});

settingsRoutes.get('/credentials', (req, res) => {
  res.json({
    clientId: config.linkedin.clientId || '',
    hasClientSecret: Boolean(config.linkedin.clientSecret),
    redirectUri: config.linkedin.redirectUri,
    scopes: config.linkedin.scopes
  });
});

settingsRoutes.post('/credentials', (req, res, next) => {
  try {
    const { clientId, clientSecret } = req.body;
    if (!clientId || typeof clientId !== 'string' || clientId.trim().length === 0) {
      return res.status(400).json({ error: 'Client ID is required' });
    }

    const cleanClientId = clientId.trim();
    config.linkedin.clientId = cleanClientId;
    process.env.LINKEDIN_CLIENT_ID = cleanClientId;

    let cleanSecret = config.linkedin.clientSecret;
    if (clientSecret && typeof clientSecret === 'string' && clientSecret.trim().length > 0) {
      cleanSecret = clientSecret.trim();
      config.linkedin.clientSecret = cleanSecret;
      process.env.LINKEDIN_CLIENT_SECRET = cleanSecret;
    }

    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      if (envContent.includes('LINKEDIN_CLIENT_ID=')) {
        envContent = envContent.replace(/^LINKEDIN_CLIENT_ID=.*$/m, `LINKEDIN_CLIENT_ID=${cleanClientId}`);
      } else {
        envContent += `\nLINKEDIN_CLIENT_ID=${cleanClientId}`;
      }

      if (cleanSecret) {
        if (envContent.includes('LINKEDIN_CLIENT_SECRET=')) {
          envContent = envContent.replace(/^LINKEDIN_CLIENT_SECRET=.*$/m, `LINKEDIN_CLIENT_SECRET=${cleanSecret}`);
        } else {
          envContent += `\nLINKEDIN_CLIENT_SECRET=${cleanSecret}`;
        }
      }

      fs.writeFileSync(envPath, envContent, 'utf8');
    }

    res.json({
      success: true,
      message: 'LinkedIn API credentials successfully updated and saved to .env',
      clientId: cleanClientId,
      hasClientSecret: Boolean(cleanSecret)
    });
  } catch (err) {
    next(err);
  }
});

settingsRoutes.post('/purge', (req, res, next) => {
  try {
    const result = automationService.purgeUserData(req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

settingsRoutes.get('/guidance', (req, res) => {
  const guidance = linkedinApiService.getProfileUpdateGuidance();
  res.json(guidance);
});

