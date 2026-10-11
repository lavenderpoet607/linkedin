import test from 'node:test';
import assert from 'node:assert/strict';
import { ExportService } from '../src/services/exportService.js';

test('Export Service: Markdown formatting structure and sections', () => {
  const service = new ExportService();
  const profile = {
    targetRole: 'Site Reliability Engineer',
    headline: 'SRE | Kubernetes & Cloud Reliability',
    about: 'Engineering scalable cloud infrastructure.',
    experience: [
      {
        title: 'Senior SRE',
        company: 'Cloud Scale Inc',
        start_date: '2022',
        end_date: '',
        is_current: true,
        responsibilities: ['Maintained 99.99% system availability'],
        tech_stack: ['Kubernetes', 'Terraform'],
        achievements_metrics: ['Reduced MTTR by 40%']
      }
    ],
    skills: ['Kubernetes', 'Terraform', 'Prometheus', 'Linux']
  };

  const md = service.toMarkdown(profile);

  assert.ok(md.includes('# LinkedIn Profile: Site Reliability Engineer'));
  assert.ok(md.includes('## Headline'));
  assert.ok(md.includes('SRE | Kubernetes & Cloud Reliability'));
  assert.ok(md.includes('## Experience'));
  assert.ok(md.includes('Senior SRE at Cloud Scale Inc'));
  assert.ok(md.includes('Reduced MTTR by 40%'));
  assert.ok(md.includes('## Manual LinkedIn Update Steps'));
});

test('Export Service: Plain text structure and readability', () => {
  const service = new ExportService();
  const profile = {
    headline: 'Frontend Architect',
    about: 'Design systems and performance.',
    skills: ['React', 'CSS'],
    contactInfo: { email: 'architect@example.com' }
  };

  const txt = service.toPlainText(profile);

  assert.ok(txt.includes('LINKEDIN PROFILE OPTIMIZATION EXPORT'));
  assert.ok(txt.includes('HEADLINE:\nFrontend Architect'));
  assert.ok(txt.includes('ABOUT / SUMMARY:\nDesign systems and performance.'));
  assert.ok(txt.includes('Email: architect@example.com'));
});

test('Export Service: Valid JSON generation and schema validation', () => {
  const service = new ExportService();
  const profile = {
    headline: 'AI Platform Engineer',
    about: 'Building inference infrastructure.',
    skills: ['Python', 'Docker']
  };
  const audit = { completenessScore: 85, totalIssues: 1 };

  const jsonStr = service.toJson(profile, audit);
  const parsed = JSON.parse(jsonStr);

  assert.equal(parsed.metadata.generator, 'LinkedIn Profile Optimizer');
  assert.equal(parsed.profile.headline, 'AI Platform Engineer');
  assert.equal(parsed.audit.completenessScore, 85);
  assert.ok(parsed.exportedAt);
});
