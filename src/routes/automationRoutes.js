import express from 'express';
import { automationService } from '../services/automationService.js';
import { draftCreateSchema, draftApproveSchema } from '../utils/validators.js';

export const automationRoutes = express.Router();

automationRoutes.get('/jobs', (req, res, next) => {
  try {
    const jobs = automationService.getJobs(req.user.id);
    res.json({ jobs });
  } catch (err) {
    next(err);
  }
});

automationRoutes.patch('/jobs/:id', (req, res, next) => {
  try {
    const status = req.body.status;
    const result = automationService.toggleJobStatus(req.user.id, req.params.id, status);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

automationRoutes.get('/reminders', (req, res, next) => {
  try {
    const reminders = automationService.checkFreshnessReminders(req.user.id);
    res.json({ reminders });
  } catch (err) {
    next(err);
  }
});

automationRoutes.get('/drafts', (req, res, next) => {
  try {
    const drafts = automationService.getDrafts(req.user.id);
    res.json({ drafts });
  } catch (err) {
    next(err);
  }
});

automationRoutes.post('/drafts', (req, res, next) => {
  try {
    const validated = draftCreateSchema.parse(req.body);
    const draft = automationService.createPostDraft(req.user.id, validated);
    res.json({ draft });
  } catch (err) {
    next(err);
  }
});

automationRoutes.post('/drafts/generate', (req, res, next) => {
  try {
    const topicCategory = req.body.category || 'Technical Learning';
    const draft = automationService.generateProfessionalPostDraft(req.user.id, topicCategory);
    res.json({ draft });
  } catch (err) {
    next(err);
  }
});

automationRoutes.post('/drafts/:id/approve', async (req, res, next) => {
  try {
    const validated = draftApproveSchema.parse(req.body);
    const result = await automationService.processDraftApproval(req.user.id, req.params.id, validated);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

automationRoutes.get('/logs', (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit || '50', 10);
    const logs = automationService.getActivityLogs(req.user.id, limit);
    res.json({ logs });
  } catch (err) {
    next(err);
  }
});
