import crypto from 'node:crypto';
import { getDb } from '../db/database.js';
import { generateId } from '../services/cryptoService.js';
import { logger } from './logger.js';

function getKeyBuffer(hexKey) {
  if (!hexKey || hexKey.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(hexKey)) {
    throw new Error('Key must be a valid 64-character hex string representing 32 bytes');
  }
  return Buffer.from(hexKey, 'hex');
}

function decryptWithKey(payload, hexKey) {
  if (!payload) return null;
  const parts = payload.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted payload structure');
  }
  const [ivHex, tagHex, encryptedHex] = parts;
  const decipher = crypto.createDecipheriv('aes-256-gcm', getKeyBuffer(hexKey), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function encryptWithKey(text, hexKey) {
  if (!text) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKeyBuffer(hexKey), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${tag}:${encrypted}`;
}

function ensureSystemUser(db) {
  const now = new Date().toISOString();
  db.prepare(
    `INSERT OR IGNORE INTO users (id, email, display_name, created_at, updated_at)
     VALUES ('system', 'system@internal.local', 'System Process', ?, ?)`
  ).run(now, now);
}

export function rotateEncryptionKey(oldHexKey, newHexKey) {
  if (oldHexKey === newHexKey) {
    throw new Error('New encryption key must be different from current key');
  }
  getKeyBuffer(oldHexKey);
  getKeyBuffer(newHexKey);

  const db = getDb();
  ensureSystemUser(db);
  const accounts = db.prepare('SELECT id, user_id, access_token_encrypted, refresh_token_encrypted FROM linkedin_accounts').all();

  const updateStmt = db.prepare(
    'UPDATE linkedin_accounts SET access_token_encrypted = ?, refresh_token_encrypted = ?, updated_at = ? WHERE id = ?'
  );

  let rotatedCount = 0;
  const now = new Date().toISOString();

  const transaction = db.transaction(() => {
    for (const acc of accounts) {
      const plainAccessToken = decryptWithKey(acc.access_token_encrypted, oldHexKey);
      const newEncAccessToken = encryptWithKey(plainAccessToken, newHexKey);

      let newEncRefreshToken = null;
      if (acc.refresh_token_encrypted) {
        const plainRefreshToken = decryptWithKey(acc.refresh_token_encrypted, oldHexKey);
        newEncRefreshToken = encryptWithKey(plainRefreshToken, newHexKey);
      }

      updateStmt.run(newEncAccessToken, newEncRefreshToken, now, acc.id);
      rotatedCount += 1;
    }

    db.prepare(
      `INSERT INTO activity_logs (id, user_id, action_type, status, details_json, created_at)
       VALUES (?, 'system', 'encryption_key_rotated', 'success', ?, ?)`
    ).run(generateId(), JSON.stringify({ reencryptedAccountsCount: rotatedCount }), now);
  });

  transaction();
  logger.info('Encryption key rotated successfully', { rotatedAccountsCount: rotatedCount });

  return {
    success: true,
    rotatedAccountsCount: rotatedCount
  };
}

export function rotateAppSecret(dbInstance = null) {
  const db = dbInstance || getDb();
  ensureSystemUser(db);
  const now = new Date().toISOString();
  const deleteResult = db.prepare('DELETE FROM sessions').run();

  db.prepare(
    `INSERT INTO activity_logs (id, user_id, action_type, status, details_json, created_at)
     VALUES (?, 'system', 'app_secret_rotated', 'success', ?, ?)`
  ).run(generateId(), JSON.stringify({ revokedSessionsCount: deleteResult.changes }), now);

  return {
    success: true,
    revokedSessionsCount: deleteResult.changes
  };
}
