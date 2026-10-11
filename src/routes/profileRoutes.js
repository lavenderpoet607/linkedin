import express from 'express';
import { profileOptimizerService } from '../services/profileOptimizerService.js';
import { profileUpdateSchema } from '../utils/validators.js';

export const profileRoutes = express.Router();

profileRoutes.get('/', (req, res, next) => {
  try {
    const profile = profileOptimizerService.getProfile(req.user.id);
    res.json({ profile });
  } catch (err) {
    next(err);
  }
});

profileRoutes.put('/', (req, res, next) => {
  try {
    const validated = profileUpdateSchema.parse(req.body);
    const summary = req.body._summary || 'Profile update';
    const updated = profileOptimizerService.updateProfile(req.user.id, validated, summary);
    res.json({ profile: updated });
  } catch (err) {
    next(err);
  }
});

profileRoutes.get('/revisions', (req, res, next) => {
  try {
    const revisions = profileOptimizerService.getRevisions(req.user.id);
    res.json({ revisions });
  } catch (err) {
    next(err);
  }
});

profileRoutes.post('/revisions/:id/restore', (req, res, next) => {
  try {
    const profile = profileOptimizerService.getProfile(req.user.id);
    const restored = profileOptimizerService.restoreRevision(req.user.id, profile.id, req.params.id);
    res.json({ profile: restored, restored: true });
  } catch (err) {
    next(err);
  }
});

profileRoutes.get('/variations', (req, res, next) => {
  try {
    const profile = profileOptimizerService.getProfile(req.user.id);
    const variations = profileOptimizerService.generateThreeAngleVariations(profile);
    res.json({ variations });
  } catch (err) {
    next(err);
  }
});

profileRoutes.post('/optimize/headline', (req, res, next) => {
  try {
    const profile = profileOptimizerService.getProfile(req.user.id);
    const options = profileOptimizerService.generateHeadlineOptions(profile);
    res.json({ options });
  } catch (err) {
    next(err);
  }
});

profileRoutes.post('/optimize/about', (req, res, next) => {
  try {
    const profile = profileOptimizerService.getProfile(req.user.id);
    const language = req.body.language || profile.language || 'id';
    const angle = req.body.angle || 'Technical Depth';
    const text = profileOptimizerService.generateOptimizedAbout(profile, language, angle);
    res.json({ text, language, angle });
  } catch (err) {
    next(err);
  }
});
