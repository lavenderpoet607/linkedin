import test from 'node:test';
import assert from 'node:assert/strict';
import { redactObject } from '../src/utils/logger.js';
import { encrypt, decrypt } from '../src/services/cryptoService.js';
import { createApp } from '../src/app.js';
import { initDb, closeDb } from '../src/db/database.js';

test('Security: Secret redaction in logger prevents leaking sensitive tokens and credentials', () => {
  const sensitivePayload = {
    user: 'dev_user',
    access_token: 'secret_linkedin_bearer_token_1234567890',
    refresh_token: 'secret_refresh_token_abcdefghijklmnop',
    client_secret: 'top_secret_linkedin_app_secret',
    password: 'super_secure_password',
    code_verifier: 'pkce_verifier_string_random',
    nested: {
      api_token: 'nested_secret_token_123',
      normal_field: 'regular_data'
    }
  };

  const redacted = redactObject(sensitivePayload);

  assert.equal(redacted.user, 'dev_user');
  assert.equal(redacted.nested.normal_field, 'regular_data');
  assert.notEqual(redacted.access_token, sensitivePayload.access_token);
  assert.ok(redacted.access_token.includes('...'));
  assert.notEqual(redacted.client_secret, sensitivePayload.client_secret);
  assert.notEqual(redacted.password, sensitivePayload.password);
  assert.notEqual(redacted.code_verifier, sensitivePayload.code_verifier);
  assert.notEqual(redacted.nested.api_token, sensitivePayload.nested.api_token);
});

test('Security: AES-256-GCM encryption round-trip and authentication tag verification', () => {
  const plaintext = 'aqw81293_very_confidential_linkedin_token_data';
  const ciphertext = encrypt(plaintext);

  assert.notEqual(ciphertext, plaintext);
  assert.equal(ciphertext.split(':').length, 3);

  const decrypted = decrypt(ciphertext);
  assert.equal(decrypted, plaintext);

  const corrupted = ciphertext.slice(0, -4) + 'ffff';
  assert.throws(() => {
    decrypt(corrupted);
  });
});

test('Security: HTTP Security headers in Express response', async () => {
  initDb(':memory:');
  const app = createApp();

  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/health`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('x-frame-options'), 'DENY');
    assert.equal(res.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
  } finally {
    server.close();
    closeDb();
  }
});
