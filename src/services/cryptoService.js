import crypto from 'node:crypto';
import { config } from '../config.js';

function getKeyBuffer() {
  const raw = config.encryptionKey;
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, 'hex');
  }
  return crypto.createHash('sha256').update(raw).digest();
}

export function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKeyBuffer(), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${tag}:${encrypted}`;
}

export function decrypt(payload) {
  if (!payload) return null;
  const parts = payload.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted payload structure');
  }
  const [ivHex, tagHex, encryptedHex] = parts;
  const decipher = crypto.createDecipheriv('aes-256-gcm', getKeyBuffer(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function base64UrlEncode(buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function generatePkcePair() {
  const verifierBytes = crypto.randomBytes(32);
  const verifier = base64UrlEncode(verifierBytes);
  const challengeHash = crypto.createHash('sha256').update(verifier).digest();
  const challenge = base64UrlEncode(challengeHash);
  return { verifier, challenge };
}

export function generateRandomState() {
  return crypto.randomBytes(24).toString('hex');
}

export function generateId() {
  return crypto.randomUUID();
}
