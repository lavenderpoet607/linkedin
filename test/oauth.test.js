import test from 'node:test';
import assert from 'node:assert/strict';
import { LinkedInOAuthService } from '../src/services/linkedinOAuthService.js';
import { LinkedInApiService } from '../src/services/linkedinApiService.js';
import { initDb, closeDb, getDb } from '../src/db/database.js';
import { generateId } from '../src/services/cryptoService.js';

test('OAuth Service: Authorization URL generation and PKCE parameters', () => {
  initDb(':memory:');
  const db = getDb();
  const service = new LinkedInOAuthService();
  const userId = generateId();

  db.prepare(
    'INSERT INTO users (id, email, display_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, 'user@test.com', 'Test User', new Date().toISOString(), new Date().toISOString());

  const urlStr = service.getAuthorizationUrl(userId);
  const url = new URL(urlStr);

  assert.equal(url.protocol, 'https:');
  assert.equal(url.hostname, 'www.linkedin.com');
  assert.equal(url.pathname, '/oauth/v2/authorization');
  assert.equal(url.searchParams.get('response_type'), 'code');
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
  assert.ok(url.searchParams.get('code_challenge').length > 20);
  assert.ok(url.searchParams.get('state').length > 20);

  const record = db.prepare('SELECT * FROM oauth_states WHERE state = ?').get(url.searchParams.get('state'));
  assert.ok(record);
  assert.equal(record.user_id, userId);

  closeDb();
});

test('OAuth Service: Callback error handling for denied access', async () => {
  initDb(':memory:');
  const service = new LinkedInOAuthService();

  await assert.rejects(
    async () => {
      await service.handleCallback({
        state: 'some_state',
        code: null,
        error: 'access_denied',
        errorDescription: 'User cancelled authorization'
      });
    },
    {
      message: 'LinkedIn authorization failed: User cancelled authorization'
    }
  );

  closeDb();
});

test('OAuth Service: Callback validation for unrecognized state', async () => {
  initDb(':memory:');
  const service = new LinkedInOAuthService();

  await assert.rejects(
    async () => {
      await service.handleCallback({
        state: 'unrecognized_state_123',
        code: 'auth_code_xyz'
      });
    },
    {
      message: 'Invalid or unrecognized OAuth state parameter'
    }
  );

  closeDb();
});

test('OAuth Service: Callback validation for expired state', async () => {
  initDb(':memory:');
  const service = new LinkedInOAuthService();
  const db = getDb();
  const state = 'expired_state_999';
  const userId = generateId();

  db.prepare(
    'INSERT INTO users (id, email, display_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, 'expired@test.com', 'Expired User', new Date().toISOString(), new Date().toISOString());

  db.prepare(
    'INSERT INTO oauth_states (state, user_id, code_verifier, expires_at, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(state, userId, 'verifier', Date.now() - 5000, new Date().toISOString());

  await assert.rejects(
    async () => {
      await service.handleCallback({
        state,
        code: 'valid_code'
      });
    },
    {
      message: 'OAuth state has expired, please restart authorization'
    }
  );

  closeDb();
});

test('OAuth Service: Successful token exchange and profile linkage', async () => {
  initDb(':memory:');
  const db = getDb();
  const userId = generateId();
  const state = 'valid_state_123';
  const verifier = 'code_verifier_123';

  db.prepare(
    'INSERT INTO users (id, email, display_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, 'dev@example.com', 'Alex Dev', new Date().toISOString(), new Date().toISOString());

  db.prepare(
    'INSERT INTO oauth_states (state, user_id, code_verifier, expires_at, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(state, userId, verifier, Date.now() + 60000, new Date().toISOString());

  const mockFetch = async (url, opts) => {
    if (url.includes('accessToken')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          access_token: 'mock_access_token_abc_123',
          expires_in: 3600,
          scope: 'openid profile email w_member_social'
        })
      };
    }
    if (url.includes('userinfo')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          sub: 'li_sub_98765',
          name: 'Alex Developer',
          email: 'alex@company.com',
          picture: 'https://media.licdn.com/dms/image/v2/pic.jpg'
        })
      };
    }
    return { ok: false, status: 404, text: async () => 'Not found' };
  };

  const service = new LinkedInOAuthService(mockFetch);
  const result = await service.handleCallback({
    state,
    code: 'auth_code_success'
  });

  assert.equal(result.connected, true);
  assert.equal(result.name, 'Alex Developer');
  assert.equal(result.email, 'alex@company.com');

  const status = service.getAccountStatus(userId);
  assert.equal(status.connected, true);
  assert.equal(status.name, 'Alex Developer');
  assert.equal(status.isExpired, false);
  assert.ok(status.scope.includes('w_member_social'));

  const dcResult = service.disconnectAccount(userId);
  assert.equal(dcResult.disconnected, true);

  const statusAfter = service.getAccountStatus(userId);
  assert.equal(statusAfter.connected, false);

  closeDb();
});

test('API Service: Scope validation prevents social share without w_member_social', async () => {
  initDb(':memory:');
  const db = getDb();
  const userId = generateId();

  db.prepare(
    'INSERT INTO users (id, email, display_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, 'user@example.com', 'Sam', new Date().toISOString(), new Date().toISOString());

  const { encrypt } = await import('../src/services/cryptoService.js');

  db.prepare(
    `INSERT INTO linkedin_accounts
     (id, user_id, linkedin_sub, name, email, picture_url, access_token_encrypted, expires_at, scope, connected_at, updated_at)
     VALUES (?, ?, 'sub1', 'Sam', 'sam@ex.com', '', ?, ?, 'openid profile email', ?, ?)`
  ).run(generateId(), userId, encrypt('mock_token'), Date.now() + 3600000, new Date().toISOString(), new Date().toISOString());

  const apiService = new LinkedInApiService();
  await assert.rejects(
    async () => {
      await apiService.publishMemberShare(userId, { text: 'Hello', idempotencyKey: 'idemp_1' });
    },
    {
      message: 'Permission w_member_social is not granted for this account'
    }
  );

  closeDb();
});
