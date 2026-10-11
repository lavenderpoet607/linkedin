import test from 'node:test';
import assert from 'node:assert/strict';
import { AutomationService } from '../src/services/automationService.js';
import { LinkedInApiService } from '../src/services/linkedinApiService.js';
import { initDb, closeDb, getDb } from '../src/db/database.js';
import { generateId, encrypt } from '../src/services/cryptoService.js';

test('Automation Service: Default jobs creation and status toggle', () => {
  initDb(':memory:');
  const db = getDb();
  const userId = generateId();

  db.prepare(
    'INSERT INTO users (id, email, display_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, 'auto@test.com', 'Auto User', new Date().toISOString(), new Date().toISOString());

  const service = new AutomationService();
  const jobs = service.getJobs(userId);

  assert.equal(jobs.length, 3);
  const auditJob = jobs.find((j) => j.job_type === 'scheduled_audit');
  assert.ok(auditJob);
  assert.equal(auditJob.status, 'active');

  const toggled = service.toggleJobStatus(userId, auditJob.id, 'paused');
  assert.equal(toggled.status, 'paused');

  const jobsAfter = service.getJobs(userId);
  const updatedJob = jobsAfter.find((j) => j.id === auditJob.id);
  assert.equal(updatedJob.status, 'paused');

  closeDb();
});

test('Automation Service: Profile freshness reminders', () => {
  initDb(':memory:');
  const db = getDb();
  const userId = generateId();
  const oldDate = new Date(Date.now() - 40 * 86400000).toISOString();

  db.prepare(
    'INSERT INTO users (id, email, display_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, 'fresh@test.com', 'Fresh User', oldDate, oldDate);

  db.prepare(
    `INSERT INTO profiles (id, user_id, headline, about, updated_at) VALUES (?, ?, 'Head', 'About', ?)`
  ).run(generateId(), userId, oldDate);

  const service = new AutomationService();
  const reminders = service.checkFreshnessReminders(userId);

  assert.ok(reminders.length > 0);
  const freshnessItem = reminders.find((r) => r.section === 'Profile Freshness');
  assert.ok(freshnessItem);
  assert.ok(freshnessItem.daysSinceUpdate >= 39);

  closeDb();
});

test('Automation Service: Content draft creation and approval queue', async () => {
  initDb(':memory:');
  const db = getDb();
  const userId = generateId();

  db.prepare(
    'INSERT INTO users (id, email, display_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, 'draft@test.com', 'Draft User', new Date().toISOString(), new Date().toISOString());

  db.prepare(
    `INSERT INTO profiles (id, user_id, headline, about, skills_json, language, updated_at)
     VALUES (?, ?, 'Engineer', 'Summary', '["Node.js", "PostgreSQL"]', 'en', ?)`
  ).run(generateId(), userId, new Date().toISOString());

  const service = new AutomationService();
  const draft = service.generateProfessionalPostDraft(userId, 'Architecture');

  assert.ok(draft.id);
  assert.equal(draft.status, 'draft');
  assert.ok(draft.content.includes('Node.js'));
  assert.ok(!draft.content.includes('—'));

  const approved = await service.processDraftApproval(userId, draft.id, { approve: true, publish_to_linkedin: false });
  assert.equal(approved.status, 'approved');

  const draftAfter = service.getDrafts(userId).find((d) => d.id === draft.id);
  assert.equal(draftAfter.status, 'approved');

  closeDb();
});

test('Automation Service: Idempotency prevents duplicate LinkedIn postings', async () => {
  initDb(':memory:');
  const db = getDb();
  const userId = generateId();
  const idempotencyKey = 'idemp_key_unique_123';

  db.prepare(
    'INSERT INTO users (id, email, display_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, 'idemp@test.com', 'Idemp User', new Date().toISOString(), new Date().toISOString());

  db.prepare(
    `INSERT INTO linkedin_accounts
     (id, user_id, linkedin_sub, name, email, picture_url, access_token_encrypted, expires_at, scope, connected_at, updated_at)
     VALUES (?, ?, 'sub_123', 'Idemp', 'idemp@test.com', '', ?, ?, 'openid profile email w_member_social', ?, ?)`
  ).run(generateId(), userId, encrypt('mock_access_token'), Date.now() + 3600000, new Date().toISOString(), new Date().toISOString());

  db.prepare(
    `INSERT INTO post_drafts
     (id, user_id, topic, content, status, idempotency_key, published_at, linkedin_post_urn, created_at)
     VALUES (?, ?, 'Topic', 'Content already sent', 'published', ?, ?, 'urn:li:share:111', ?)`
  ).run(generateId(), userId, idempotencyKey, new Date().toISOString(), new Date().toISOString());

  const apiService = new LinkedInApiService();
  const result = await apiService.publishMemberShare(userId, {
    text: 'Content already sent',
    idempotencyKey
  });

  assert.equal(result.alreadyPublished, true);
  assert.equal(result.postUrn, 'urn:li:share:111');

  closeDb();
});

test('Automation Service: User data purge cleanly erases all records', () => {
  initDb(':memory:');
  const db = getDb();
  const userId = generateId();

  db.prepare(
    'INSERT INTO users (id, email, display_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, 'purge@test.com', 'Purge User', new Date().toISOString(), new Date().toISOString());

  db.prepare(
    `INSERT INTO profiles (id, user_id, headline, about, updated_at) VALUES (?, ?, 'Head', 'About', ?)`
  ).run(generateId(), userId, new Date().toISOString());

  const service = new AutomationService();
  service.createPostDraft(userId, { topic: 'Draft To Delete', content: 'Secret content' });

  const purgeRes = service.purgeUserData(userId);
  assert.equal(purgeRes.purged, true);

  const draftsAfter = service.getDrafts(userId);
  assert.equal(draftsAfter.length, 0);

  const profileAfter = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId);
  assert.equal(profileAfter.headline, '');
  assert.equal(profileAfter.about, '');

  closeDb();
});
