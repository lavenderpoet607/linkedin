import test from 'node:test';
import assert from 'node:assert/strict';
import { validateEnvironment } from '../src/utils/envValidator.js';

test('Environment Validator: Accepts valid full configuration', () => {
  const validEnv = {
    PORT: '3000',
    NODE_ENV: 'development',
    APP_SECRET: 'a'.repeat(32),
    ENCRYPTION_KEY: '0123456789abcdef'.repeat(4),
    LINKEDIN_CLIENT_ID: 'test_client_id',
    LINKEDIN_CLIENT_SECRET: 'test_client_secret',
    LINKEDIN_REDIRECT_URI: 'http://localhost:3000/auth/linkedin/callback',
    LINKEDIN_SCOPES: 'openid,profile,email,w_member_social',
    DATABASE_PATH: ':memory:',
    SESSION_MAX_AGE_MS: '86400000',
    RATE_LIMIT_WINDOW_MS: '60000',
    RATE_LIMIT_MAX_REQUESTS: '120',
    LINKEDIN_MCP_SERVER_URL: '',
    LINKEDIN_MCP_ENABLED: 'false',
    AI_PROVIDER: 'grounded',
    AI_API_KEY: ''
  };

  const result = validateEnvironment(validEnv);
  assert.equal(result.valid, true);
  assert.equal(result.data.PORT, 3000);
  assert.equal(result.data.NODE_ENV, 'development');
});

test('Environment Validator: Fails on invalid PORT or NODE_ENV', () => {
  const baseEnv = {
    PORT: '999999',
    NODE_ENV: 'staging',
    APP_SECRET: 'a'.repeat(32),
    ENCRYPTION_KEY: '0123456789abcdef'.repeat(4),
    LINKEDIN_REDIRECT_URI: 'http://localhost:3000/auth/linkedin/callback',
    DATABASE_PATH: ':memory:',
    SESSION_MAX_AGE_MS: '86400000',
    RATE_LIMIT_WINDOW_MS: '60000',
    RATE_LIMIT_MAX_REQUESTS: '120'
  };

  assert.throws(() => {
    validateEnvironment(baseEnv);
  }, /Environment validation failed/);
});

test('Environment Validator: Fails on key collision between APP_SECRET and ENCRYPTION_KEY', () => {
  const identicalKey = '0123456789abcdef'.repeat(4);
  const collisionEnv = {
    PORT: '3000',
    NODE_ENV: 'development',
    APP_SECRET: identicalKey,
    ENCRYPTION_KEY: identicalKey,
    LINKEDIN_REDIRECT_URI: 'http://localhost:3000/auth/linkedin/callback',
    DATABASE_PATH: ':memory:',
    SESSION_MAX_AGE_MS: '86400000',
    RATE_LIMIT_WINDOW_MS: '60000',
    RATE_LIMIT_MAX_REQUESTS: '120'
  };

  assert.throws(() => {
    validateEnvironment(collisionEnv);
  }, /APP_SECRET and ENCRYPTION_KEY must be distinct keys/);
});

test('Environment Validator: Enforces strict production rules against mock secrets and HTTP', () => {
  const mockProdEnv = {
    PORT: '3000',
    NODE_ENV: 'production',
    APP_SECRET: 'replace_with_64_character_random_hex_string',
    ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    LINKEDIN_CLIENT_ID: 'mock_linkedin_client_id',
    LINKEDIN_CLIENT_SECRET: 'mock_linkedin_client_secret',
    LINKEDIN_REDIRECT_URI: 'http://localhost:3000/auth/linkedin/callback',
    DATABASE_PATH: ':memory:',
    SESSION_MAX_AGE_MS: '86400000',
    RATE_LIMIT_WINDOW_MS: '60000',
    RATE_LIMIT_MAX_REQUESTS: '120'
  };

  assert.throws(() => {
    validateEnvironment(mockProdEnv);
  }, /Production environment cannot use mock/);

  const realProdWithHttp = {
    PORT: '443',
    NODE_ENV: 'production',
    APP_SECRET: 'b'.repeat(32),
    ENCRYPTION_KEY: 'fedcba9876543210'.repeat(4),
    LINKEDIN_CLIENT_ID: 'real_client_id_987654',
    LINKEDIN_CLIENT_SECRET: 'real_client_secret_abcdef',
    LINKEDIN_REDIRECT_URI: 'http://optimizer.example.com/callback',
    DATABASE_PATH: ':memory:',
    SESSION_MAX_AGE_MS: '86400000',
    RATE_LIMIT_WINDOW_MS: '60000',
    RATE_LIMIT_MAX_REQUESTS: '120'
  };

  assert.throws(() => {
    validateEnvironment(realProdWithHttp);
  }, /Production environment requires HTTPS redirect URI/);
});
