import test from 'node:test';
import assert from 'node:assert/strict';
import { ProfileOptimizerService } from '../src/services/profileOptimizerService.js';
import { initDb, closeDb, getDb } from '../src/db/database.js';
import { generateId } from '../src/services/cryptoService.js';

test('Profile Optimizer: Completeness score calculation', () => {
  const service = new ProfileOptimizerService();

  const emptyProfile = {};
  assert.equal(service.calculateCompleteness(emptyProfile), 0);

  const partialProfile = {
    headline: 'Senior Backend Engineer | Distributed Systems & Node.js',
    about: 'Experienced software engineer focusing on backend reliability, high throughput databases, and API development with over seven years in production environments.',
    target_role: 'Senior Backend Engineer',
    skills: ['Node.js', 'PostgreSQL', 'Docker', 'Redis', 'TypeScript']
  };
  const score = service.calculateCompleteness(partialProfile);
  assert.ok(score >= 50);

  const fullProfile = {
    ...partialProfile,
    experience: [
      {
        title: 'Lead Backend Engineer',
        company: 'Fintech Solutions',
        responsibilities: ['Architect core ledger service'],
        achievements_metrics: ['Reduced latency by 35%']
      }
    ],
    education: [{ institution: 'State University', degree: 'B.S. in Computer Science' }],
    certifications: [{ name: 'Cloud Architect', issuing_organization: 'GCP' }],
    projects: [{ title: 'Payment Gateway', description: 'Zero-downtime routing' }],
    contact_info: { email: 'dev@example.com', portfolio_url: 'https://dev.portfolio' }
  };
  assert.equal(service.calculateCompleteness(fullProfile), 100);
});

test('Profile Optimizer: Audit identifies buzzwords, missing sections, and weak metrics', () => {
  const service = new ProfileOptimizerService();

  const slopProfile = {
    headline: 'Passionate rockstar developer',
    about: 'I am a passionate and results-driven thought leader building cutting-edge synergy solutions.',
    skills: ['Java'],
    experience: [
      {
        title: 'Developer',
        company: 'Tech Corp',
        responsibilities: ['Wrote code'],
        achievements_metrics: []
      }
    ]
  };

  const audit = service.auditProfile(slopProfile);
  assert.ok(audit.detectedBuzzwords.includes('passionate'));
  assert.ok(audit.detectedBuzzwords.includes('rockstar'));
  assert.ok(audit.detectedBuzzwords.includes('results-driven'));
  assert.ok(audit.detectedBuzzwords.includes('thought leader'));

  const buzzwordIssue = audit.issues.find((i) => i.type === 'buzzwords');
  assert.ok(buzzwordIssue);
  assert.equal(buzzwordIssue.tier, 'medium');

  const metricsIssue = audit.issues.find((i) => i.type === 'missing_metrics');
  assert.ok(metricsIssue);
});

test('Profile Optimizer: Headline options are strictly grounded in user facts and within 220 characters', () => {
  const service = new ProfileOptimizerService();

  const userProfile = {
    target_role: 'Platform Engineer',
    target_industry: 'Fintech',
    skills: ['Kubernetes', 'Go', 'Terraform', 'PostgreSQL'],
    experience: [{ title: 'Site Reliability Engineer', company: 'Global Payments' }]
  };

  const options = service.generateHeadlineOptions(userProfile);
  assert.equal(options.length, 3);

  for (const opt of options) {
    assert.ok(opt.fitsLimit);
    assert.ok(opt.characterCount <= 220);
    assert.ok(opt.headline.includes('Platform Engineer'));
    assert.ok(opt.headline.includes('Kubernetes') || opt.headline.includes('Go'));
    assert.ok(!opt.headline.includes('undefined'));
    assert.ok(!opt.headline.includes('rockstar'));
  }
});

test('Profile Optimizer: About narrative is grounded in user input with no hallucinated companies', () => {
  const service = new ProfileOptimizerService();

  const userProfile = {
    target_role: 'Staff Engineer',
    skills: ['Distributed Systems', 'Python', 'Kafka'],
    experience: [
      {
        company: 'PT Data Prima',
        title: 'Senior Engineer',
        responsibilities: ['Designed event-driven streaming pipeline'],
        achievements_metrics: ['Handled 40,000 events per second']
      }
    ]
  };

  const aboutId = service.generateOptimizedAbout(userProfile, 'id', 'Technical Depth');
  assert.ok(aboutId.includes('PT Data Prima'));
  assert.ok(aboutId.includes('Staff Engineer'));
  assert.ok(aboutId.includes('40,000 events per second'));
  assert.ok(!aboutId.includes('Google') && !aboutId.includes('Amazon'));

  const aboutEn = service.generateOptimizedAbout(userProfile, 'en', 'Impact & Product Value');
  assert.ok(aboutEn.includes('PT Data Prima'));
  assert.ok(aboutEn.includes('Staff Engineer'));
  assert.ok(aboutEn.includes('Business Value Focus'));
  assert.ok(!aboutEn.includes('—'));
});

test('Profile Optimizer: Three-angle variations generation', () => {
  const service = new ProfileOptimizerService();
  const userProfile = {
    target_role: 'Engineering Manager',
    skills: ['Team Mentorship', 'System Design', 'Agile Delivery'],
    language: 'en'
  };

  const angles = service.generateThreeAngleVariations(userProfile);
  assert.equal(angles.length, 3);
  const names = angles.map((a) => a.angle);
  assert.ok(names.includes('Technical Depth'));
  assert.ok(names.includes('Impact & Product Value'));
  assert.ok(names.includes('Team Leadership'));
});

test('Profile Optimizer: Revision snapshots and restore functionality', () => {
  initDb(':memory:');
  const db = getDb();
  const userId = generateId();

  db.prepare(
    'INSERT INTO users (id, email, display_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, 'engineer@test.com', 'Engineer One', new Date().toISOString(), new Date().toISOString());

  const service = new ProfileOptimizerService();
  const initial = service.getProfile(userId);

  service.updateProfile(userId, { headline: 'Initial Headline' }, 'First save');
  const updated1 = service.getProfile(userId);
  assert.equal(updated1.headline, 'Initial Headline');

  service.updateProfile(userId, { headline: 'Changed Headline' }, 'Second save');
  const updated2 = service.getProfile(userId);
  assert.equal(updated2.headline, 'Changed Headline');

  const revisions = service.getRevisions(userId);
  assert.ok(revisions.length >= 2);

  const firstRev = revisions.find((r) => r.version_number === 1);
  assert.ok(firstRev);

  const restored = service.restoreRevision(userId, initial.id, firstRev.id);
  assert.equal(restored.headline, '');

  closeDb();
});
