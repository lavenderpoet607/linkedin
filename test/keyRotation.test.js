import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { initDb, closeDb, getDb } from '../src/db/database.js';
import { generateId } from '../src/services/cryptoService.js';
import { rotateEncryptionKey, rotateAppSecret } from '../src/utils/keyRotation.js';

function encryptWithHexKey(plaintext, hexKey) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(hexKey, 'hex'), iv);
  let enc = cipher.update(plaintext, 'utf8', 'hex');
  enc += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${tag}:${enc}`;
}

function decryptWithHexKey(ciphertext, hexKey) {
  const parts = ciphertext.split(':');
  const [ivHex, tagHex, encHex] = parts;
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(hexKey, 'hex'), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  let dec = decipher.update(encHex, 'hex', 'utf8');
  dec += decipher.final('utf8');
  return dec;
}

test('Key Rotation: Re-encrypts stored tokens with new encryption key', () => {
  initDb(':memory:');
  const db = getDb();

  const userId = generateId();
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO users (id, email, display_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, 'rotate@test.com', 'Rotation User', now, now);

  const oldKey = crypto.randomBytes(32).toString('hex');
  const newKey = crypto.randomBytes(32).toString('hex');

  const rawAccessToken = 'live_secret_access_token_abcdef123456';
  const rawRefreshToken = 'live_secret_refresh_token_7890abcdef';

  const oldEncAccess = encryptWithHexKey(rawAccessToken, oldKey);
  const oldEncRefresh = encryptWithHexKey(rawRefreshToken, oldKey);

  const accountId = generateId();
  db.prepare(
    `INSERT INTO linkedin_accounts (
      id, user_id, linkedin_sub, name, email, picture_url,
      access_token_encrypted, refresh_token_encrypted,
      expires_at, scope, connected_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    accountId,
    userId,
    'li_rotate_123',
    'Rotation User',
    'rotate@test.com',
    null,
    oldEncAccess,
    oldEncRefresh,
    Date.now() + 3600000,
    'openid,profile,w_member_social',
    now,
    now
  );

  const rotationResult = rotateEncryptionKey(oldKey, newKey);
  assert.equal(rotationResult.success, true);
  assert.equal(rotationResult.rotatedAccountsCount, 1);

  const updatedAcc = db.prepare('SELECT access_token_encrypted, refresh_token_encrypted FROM linkedin_accounts WHERE id = ?').get(accountId);
  assert.notEqual(updatedAcc.access_token_encrypted, oldEncAccess);

  const decryptedAccessWithNewKey = decryptWithHexKey(updatedAcc.access_token_encrypted, newKey);
  assert.equal(decryptedAccessWithNewKey, rawAccessToken);

  const decryptedRefreshWithNewKey = decryptWithHexKey(updatedAcc.refresh_token_encrypted, newKey);
  assert.equal(decryptedRefreshWithNewKey, rawRefreshToken);

  assert.throws(() => {
    decryptWithHexKey(updatedAcc.access_token_encrypted, oldKey);
  });

  closeDb();
});

test('Key Rotation: Rejects invalid or identical keys', () => {
  const sameKey = crypto.randomBytes(32).toString('hex');
  assert.throws(() => {
    rotateEncryptionKey(sameKey, sameKey);
  }, /New encryption key must be different/);

  assert.throws(() => {
    rotateEncryptionKey('invalid_short_key', sameKey);
  }, /Key must be a valid 64-character hex string/);
});

test('Key Rotation: App secret rotation invalidates all existing active sessions', () => {
  initDb(':memory:');
  const db = getDb();

  const userId = generateId();
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO users (id, email, display_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, 'session@test.com', 'Session User', now, now);

  const sessionId1 = generateId();
  const sessionId2 = generateId();
  const expires = new Date(Date.now() + 86400000).toISOString();

  db.prepare('INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)').run(sessionId1, userId, expires, now);
  db.prepare('INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)').run(sessionId2, userId, expires, now);

  const initialCount = db.prepare('SELECT count(*) as count FROM sessions').get().count;
  assert.equal(initialCount, 2);

  const result = rotateAppSecret(db);
  assert.equal(result.success, true);
  assert.equal(result.revokedSessionsCount, 2);

  const finalCount = db.prepare('SELECT count(*) as count FROM sessions').get().count;
  assert.equal(finalCount, 0);

  closeDb();
});
