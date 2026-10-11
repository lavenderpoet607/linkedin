import { z } from 'zod';
import path from 'node:path';
import fs from 'node:fs';

const KNOWN_MOCK_VALUES = [
  'replace_with_64_character_random_hex_string',
  'replace_with_64_character_hex_for_aes_256_gcm',
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  'dev_app_secret_at_least_32_bytes_long_value_123456789',
  'mock_linkedin_client_id',
  'mock_linkedin_client_secret',
  'your_linkedin_client_id',
  'your_linkedin_client_secret'
];

export const envSchema = z.object({
  PORT: z.string().regex(/^\d+$/).transform(Number).refine((n) => n > 0 && n <= 65535, {
    message: 'PORT must be an integer between 1 and 65535'
  }),
  NODE_ENV: z.enum(['development', 'test', 'production']),
  APP_SECRET: z.string().min(32, 'APP_SECRET must be at least 32 characters'),
  ENCRYPTION_KEY: z
    .string()
    .length(64, 'ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)')
    .regex(/^[0-9a-fA-F]{64}$/, 'ENCRYPTION_KEY must be a valid hex string'),
  LINKEDIN_CLIENT_ID: z.string().optional().default(''),
  LINKEDIN_CLIENT_SECRET: z.string().optional().default(''),
  LINKEDIN_REDIRECT_URI: z.string().url('LINKEDIN_REDIRECT_URI must be a valid absolute URL'),
  LINKEDIN_SCOPES: z.string().optional().default('openid,profile,email,w_member_social'),
  LINKEDIN_API_VERSION: z.string().optional().default('202609'),
  DATABASE_PATH: z.string().min(1),
  SESSION_MAX_AGE_MS: z.string().regex(/^\d+$/).transform(Number).refine((n) => n >= 60000 && n <= 30 * 86400000, {
    message: 'SESSION_MAX_AGE_MS must be between 1 minute and 30 days'
  }),
  RATE_LIMIT_WINDOW_MS: z.string().regex(/^\d+$/).transform(Number).refine((n) => n >= 1000 && n <= 3600000, {
    message: 'RATE_LIMIT_WINDOW_MS must be between 1 second and 1 hour'
  }),
  RATE_LIMIT_MAX_REQUESTS: z.string().regex(/^\d+$/).transform(Number).refine((n) => n >= 5 && n <= 10000, {
    message: 'RATE_LIMIT_MAX_REQUESTS must be between 5 and 10000'
  }),
  LINKEDIN_MCP_SERVER_URL: z.string().optional().default(''),
  LINKEDIN_MCP_ENABLED: z.string().optional().default('false'),
  AI_PROVIDER: z.enum(['grounded', 'gemini', 'openai']).optional().default('grounded'),
  AI_API_KEY: z.string().optional().default('')
});

export function validateEnvironment(envObj = process.env) {
  const result = envSchema.safeParse(envObj);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    throw new Error(`Environment validation failed: ${issues}`);
  }

  const data = result.data;

  if (data.APP_SECRET === data.ENCRYPTION_KEY) {
    throw new Error('APP_SECRET and ENCRYPTION_KEY must be distinct keys serving separate purposes');
  }

  if (data.NODE_ENV === 'production') {
    if (KNOWN_MOCK_VALUES.includes(data.APP_SECRET)) {
      throw new Error('Production environment cannot use mock APP_SECRET');
    }
    if (KNOWN_MOCK_VALUES.includes(data.ENCRYPTION_KEY)) {
      throw new Error('Production environment cannot use mock ENCRYPTION_KEY');
    }
    if (!data.LINKEDIN_CLIENT_ID || KNOWN_MOCK_VALUES.includes(data.LINKEDIN_CLIENT_ID)) {
      throw new Error('Production environment requires a real LINKEDIN_CLIENT_ID');
    }
    if (!data.LINKEDIN_CLIENT_SECRET || KNOWN_MOCK_VALUES.includes(data.LINKEDIN_CLIENT_SECRET)) {
      throw new Error('Production environment requires a real LINKEDIN_CLIENT_SECRET');
    }
    if (!data.LINKEDIN_REDIRECT_URI.startsWith('https://')) {
      throw new Error('Production environment requires HTTPS redirect URI');
    }
  }

  if (data.DATABASE_PATH !== ':memory:') {
    const dir = path.dirname(path.resolve(data.DATABASE_PATH));
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (err) {
      throw new Error(`Database directory path is not writable: ${dir}`);
    }
  }

  return {
    valid: true,
    data
  };
}
