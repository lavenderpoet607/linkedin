import express from 'express';
import { profileOptimizerService } from '../services/profileOptimizerService.js';
import { exportService } from '../services/exportService.js';

export const exportRoutes = express.Router();

exportRoutes.get('/markdown', (req, res, next) => {
  try {
    const profile = profileOptimizerService.getProfile(req.user.id);
    const audit = profileOptimizerService.auditProfile(profile);
    const md = exportService.toMarkdown(profile, audit);
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="linkedin-profile-optimized.md"');
    res.send(md);
  } catch (err) {
    next(err);
  }
});

exportRoutes.get('/text', (req, res, next) => {
  try {
    const profile = profileOptimizerService.getProfile(req.user.id);
    const txt = exportService.toPlainText(profile);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="linkedin-profile-optimized.txt"');
    res.send(txt);
  } catch (err) {
    next(err);
  }
});

exportRoutes.get('/json', (req, res, next) => {
  try {
    const profile = profileOptimizerService.getProfile(req.user.id);
    const audit = profileOptimizerService.auditProfile(profile);
    const jsonStr = exportService.toJson(profile, audit);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="linkedin-profile-optimized.json"');
    res.send(jsonStr);
  } catch (err) {
    next(err);
  }
});
