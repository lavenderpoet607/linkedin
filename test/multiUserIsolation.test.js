import test from 'node:test';
import assert from 'node:assert/strict';
import { ProfileOptimizerService } from '../src/services/profileOptimizerService.js';
import { AutomationService } from '../src/services/automationService.js';
import { initDb, closeDb, getDb } from '../src/db/database.js';
import { generateId } from '../src/services/cryptoService.js';

test('Multi-User Data Isolation: Complete separation between tenant accounts', () => {
  initDb(':memory:');
  const db = getDb();
  const userA = generateId();
  const userB = generateId();
  const now = new Date().toISOString();

  db.prepare(
    'INSERT INTO users (id, email, display_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
  ).run(userA, 'userA@test.com', 'Alice', now, now);

  db.prepare(
    'INSERT INTO users (id, email, display_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
  ).run(userB, 'userB@test.com', 'Bob', now, now);

  const profileService = new ProfileOptimizerService();
  const autoService = new AutomationService();

  profileService.updateProfile(userA, {
    headline: 'Alice Headline',
    about: 'Alice about narrative',
    skills: ['Go', 'Kubernetes']
  }, 'Alice initial');

  profileService.updateProfile(userB, {
    headline: 'Bob Headline',
    about: 'Bob about narrative',
    skills: ['Python', 'Django']
  }, 'Bob initial');

  const profileA = profileService.getProfile(userA);
  const profileB = profileService.getProfile(userB);

  assert.equal(profileA.headline, 'Alice Headline');
  assert.equal(profileB.headline, 'Bob Headline');
  assert.notEqual(profileA.id, profileB.id);

  autoService.createPostDraft(userA, { topic: 'Alice Secret Draft', content: 'Alice draft content' });
  autoService.createPostDraft(userB, { topic: 'Bob Public Draft', content: 'Bob draft content' });

  const draftsA = autoService.getDrafts(userA);
  const draftsB = autoService.getDrafts(userB);

  assert.equal(draftsA.length, 1);
  assert.equal(draftsB.length, 1);
  assert.equal(draftsA[0].topic, 'Alice Secret Draft');
  assert.equal(draftsB[0].topic, 'Bob Public Draft');

  const revisionsA = profileService.getRevisions(userA);
  const revisionsB = profileService.getRevisions(userB);

  for (const rev of revisionsA) {
    assert.equal(rev.change_summary.includes('Bob'), false);
  }

  closeDb();
});
