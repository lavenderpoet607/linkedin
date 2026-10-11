import express from 'express';
import { profileOptimizerService } from '../services/profileOptimizerService.js';
import { keywordAnalyzerService } from '../services/keywordAnalyzerService.js';
import { aiProviderService } from '../services/aiProviderService.js';

export const auditRoutes = express.Router();

auditRoutes.get('/', (req, res, next) => {
  try {
    const profile = profileOptimizerService.getProfile(req.user.id);
    const audit = profileOptimizerService.auditProfile(profile);
    res.json({ audit });
  } catch (err) {
    next(err);
  }
});

auditRoutes.post('/keywords', (req, res, next) => {
  try {
    const profile = profileOptimizerService.getProfile(req.user.id);
    const jobDescription = req.body.jobDescription || '';
    const analysis = keywordAnalyzerService.analyze({ profile, jobDescription });
    res.json({ analysis });
  } catch (err) {
    next(err);
  }
});

auditRoutes.post('/recommendations', async (req, res, next) => {
  try {
    const profile = profileOptimizerService.getProfile(req.user.id);
    const jobDescription = req.body.jobDescription || '';
    const recommendations = await aiProviderService.generateStructuredRecommendations(profile, jobDescription);
    res.json(recommendations);
  } catch (err) {
    next(err);
  }
});

auditRoutes.get('/recommendations', async (req, res, next) => {
  try {
    const profile = profileOptimizerService.getProfile(req.user.id);
    const recommendations = await aiProviderService.generateStructuredRecommendations(profile);
    res.json(recommendations);
  } catch (err) {
    next(err);
  }
});
