import dotenv from 'dotenv';
import { validateEnvironment } from './utils/envValidator.js';

dotenv.config();

const validated = validateEnvironment(process.env);
const env = validated.data;

export const config = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  appSecret: env.APP_SECRET,
  encryptionKey: env.ENCRYPTION_KEY,
  linkedin: {
    clientId: env.LINKEDIN_CLIENT_ID,
    clientSecret: env.LINKEDIN_CLIENT_SECRET,
    redirectUri: env.LINKEDIN_REDIRECT_URI,
    scopes: env.LINKEDIN_SCOPES.split(',').map((s) => s.trim()),
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    userInfoUrl: 'https://api.linkedin.com/v2/userinfo',
    postsUrl: 'https://api.linkedin.com/rest/posts',
    apiVersion: env.LINKEDIN_API_VERSION || '202609'
  },
  mcp: {
    enabled: env.LINKEDIN_MCP_ENABLED === 'true',
    serverUrl: env.LINKEDIN_MCP_SERVER_URL
  },
  ai: {
    provider: env.AI_PROVIDER,
    apiKey: env.AI_API_KEY
  },
  databasePath: env.DATABASE_PATH,
  sessionMaxAgeMs: env.SESSION_MAX_AGE_MS,
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS
  }
};
