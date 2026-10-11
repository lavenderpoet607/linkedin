import dotenv from 'dotenv';
import { config } from '../config.js';
import { getDb } from '../db/database.js';
import {
  generateId,
  generatePkcePair,
  generateRandomState,
  encrypt,
  decrypt
} from './cryptoService.js';
import { logger } from '../utils/logger.js';

export class LinkedInOAuthService {
  constructor(fetchImpl = fetch) {
    this.fetch = fetchImpl;
  }

  _syncCredentials() {
    try {
      dotenv.config({ override: true });
      if (process.env.LINKEDIN_CLIENT_ID) {
        config.linkedin.clientId = process.env.LINKEDIN_CLIENT_ID.trim();
      }
      if (process.env.LINKEDIN_CLIENT_SECRET) {
        config.linkedin.clientSecret = process.env.LINKEDIN_CLIENT_SECRET.trim();
      }
      if (process.env.LINKEDIN_REDIRECT_URI) {
        config.linkedin.redirectUri = process.env.LINKEDIN_REDIRECT_URI.trim();
      }
      if (process.env.LINKEDIN_SCOPES) {
        config.linkedin.scopes = process.env.LINKEDIN_SCOPES.split(',').map((s) => s.trim());
      }
      if (process.env.LINKEDIN_API_VERSION) {
        config.linkedin.apiVersion = process.env.LINKEDIN_API_VERSION.trim();
      }
    } catch {}
  }

  getAuthorizationUrl(userId, options = {}) {
    this._syncCredentials();
    const db = getDb();
    const state = generateRandomState();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    const usePkce = options.usePkce ?? true;

    let verifier = '';
    let challenge = null;
    if (usePkce) {
      const pkce = generatePkcePair();
      verifier = pkce.verifier;
      challenge = pkce.challenge;
    }

    db.prepare('DELETE FROM oauth_states WHERE user_id = ?').run(userId);
    db.prepare(
      'INSERT INTO oauth_states (state, user_id, code_verifier, expires_at, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(state, userId, verifier, expiresAt, new Date().toISOString());

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: (config.linkedin.clientId || '').trim(),
      redirect_uri: config.linkedin.redirectUri,
      state,
      scope: config.linkedin.scopes.join(' ')
    });

    if (usePkce && challenge) {
      params.set('code_challenge', challenge);
      params.set('code_challenge_method', 'S256');
    }

    return `${config.linkedin.authUrl}?${params.toString()}`;
  }

  async handleCallback({ state, code, error, errorDescription }) {
    this._syncCredentials();
    const db = getDb();

    if (error) {
      logger.warn('OAuth provider returned error', { error, errorDescription });
      throw new Error(`LinkedIn authorization failed: ${errorDescription || error}`);
    }

    if (!state || !code) {
      throw new Error('Missing state or code in OAuth callback');
    }

    const stateRecord = db.prepare('SELECT * FROM oauth_states WHERE state = ?').get(state);
    if (!stateRecord) {
      throw new Error('Invalid or unrecognized OAuth state parameter');
    }

    if (stateRecord.expires_at < Date.now()) {
      db.prepare('DELETE FROM oauth_states WHERE state = ?').run(state);
      throw new Error('OAuth state has expired, please restart authorization');
    }

    const userId = stateRecord.user_id;
    const codeVerifier = stateRecord.code_verifier;
    db.prepare('DELETE FROM oauth_states WHERE state = ?').run(state);

    const clientId = (config.linkedin.clientId || '').trim();
    const clientSecret = (config.linkedin.clientSecret || '').trim();

    if (!clientId || !clientSecret) {
      throw new Error('LinkedIn Client ID or Client Secret is missing in server configuration');
    }

    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.linkedin.redirectUri,
      client_id: clientId,
      client_secret: clientSecret
    });

    if (codeVerifier && codeVerifier.trim().length > 0) {
      tokenParams.set('code_verifier', codeVerifier);
    }

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const tokenRes = await this.fetch(config.linkedin.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`
      },
      body: tokenParams.toString()
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      logger.error('Failed to exchange authorization code for token', { status: tokenRes.status });
      throw new Error(`Token exchange failed with status ${tokenRes.status}: ${errText}`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token || null;
    const expiresIn = tokenData.expires_in || 5184000;
    const expiresAt = Date.now() + expiresIn * 1000;
    const scope = tokenData.scope || config.linkedin.scopes.join(' ');

    let userInfo = null;

    if (tokenData.id_token) {
      try {
        const parts = tokenData.id_token.split('.');
        if (parts.length >= 2) {
          const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          const decodedText = Buffer.from(payloadBase64, 'base64').toString('utf8');
          userInfo = JSON.parse(decodedText);
        }
      } catch (parseErr) {
        logger.warn('Failed to parse OIDC id_token payload', { error: parseErr.message });
      }
    }

    try {
      const userInfoRes = await this.fetch(config.linkedin.userInfoUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      if (userInfoRes.ok) {
        const remoteInfo = await userInfoRes.json();
        userInfo = { ...userInfo, ...remoteInfo };
      } else {
        logger.warn('Remote userinfo endpoint returned non-OK status', { status: userInfoRes.status });
      }
    } catch (fetchErr) {
      logger.warn('Remote userinfo request failed', { error: fetchErr.message });
    }

    if (!userInfo || !userInfo.sub) {
      throw new Error('User identity could not be retrieved from LinkedIn OpenID Connect response');
    }

    const linkedinSub = userInfo.sub;
    const name = userInfo.name || `${userInfo.given_name || ''} ${userInfo.family_name || ''}`.trim() || 'LinkedIn Member';
    const email = userInfo.email || '';
    const pictureUrl = userInfo.picture || '';

    const encAccessToken = encrypt(accessToken);
    const encRefreshToken = refreshToken ? encrypt(refreshToken) : null;
    const now = new Date().toISOString();

    const existing = db.prepare('SELECT id FROM linkedin_accounts WHERE user_id = ?').get(userId);
    if (existing) {
      db.prepare(
        `UPDATE linkedin_accounts
         SET linkedin_sub = ?, name = ?, email = ?, picture_url = ?,
             access_token_encrypted = ?, refresh_token_encrypted = ?,
             expires_at = ?, scope = ?, updated_at = ?
         WHERE user_id = ?`
      ).run(
        linkedinSub,
        name,
        email,
        pictureUrl,
        encAccessToken,
        encRefreshToken,
        expiresAt,
        scope,
        now,
        userId
      );
    } else {
      db.prepare(
        `INSERT INTO linkedin_accounts
         (id, user_id, linkedin_sub, name, email, picture_url,
          access_token_encrypted, refresh_token_encrypted, expires_at,
          scope, connected_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        generateId(),
        userId,
        linkedinSub,
        name,
        email,
        pictureUrl,
        encAccessToken,
        encRefreshToken,
        expiresAt,
        scope,
        now,
        now
      );
    }

    db.prepare(
      `INSERT INTO activity_logs (id, user_id, action_type, status, details_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      generateId(),
      userId,
      'linkedin_connect',
      'success',
      JSON.stringify({ linkedinSub, name, scope }),
      now
    );

    return {
      connected: true,
      name,
      email,
      pictureUrl,
      scope,
      expiresAt
    };
  }

  getAccountStatus(userId) {
    const db = getDb();
    const account = db.prepare('SELECT * FROM linkedin_accounts WHERE user_id = ?').get(userId);
    if (!account) {
      return {
        connected: false,
        name: null,
        email: null,
        pictureUrl: null,
        scope: [],
        expiresAt: null,
        isExpired: false,
        apiLimitations: {
          memberProfileWrite: false,
          memberShareWrite: false,
          message: 'Direct API writing of profile fields (Headline, Summary, Experience) is restricted by LinkedIn official member API. Optimized sections are exported for one-click manual copy-paste.'
        }
      };
    }

    const isExpired = account.expires_at < Date.now();
    const scopesList = account.scope ? account.scope.split(/[,\s]+/).filter(Boolean) : [];
    const hasSocialShare = scopesList.includes('w_member_social');

    return {
      connected: true,
      name: account.name,
      email: account.email,
      pictureUrl: account.picture_url,
      scope: scopesList,
      expiresAt: account.expires_at,
      isExpired,
      connectedAt: account.connected_at,
      apiLimitations: {
        memberProfileWrite: false,
        memberShareWrite: hasSocialShare,
        message: 'Direct API writing of profile fields (Headline, Summary, Experience) is restricted by LinkedIn official member API. Optimized sections are exported for one-click manual copy-paste.'
      }
    };
  }

  disconnectAccount(userId) {
    const db = getDb();
    const account = db.prepare('SELECT * FROM linkedin_accounts WHERE user_id = ?').get(userId);
    if (!account) {
      return { disconnected: true, alreadyDisconnected: true };
    }

    db.prepare('DELETE FROM linkedin_accounts WHERE user_id = ?').run(userId);

    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO activity_logs (id, user_id, action_type, status, details_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      generateId(),
      userId,
      'linkedin_disconnect',
      'success',
      JSON.stringify({ message: 'Account disconnected and tokens deleted' }),
      now
    );

    return { disconnected: true, alreadyDisconnected: false };
  }

  getDecryptedAccessToken(userId) {
    const db = getDb();
    const account = db.prepare('SELECT * FROM linkedin_accounts WHERE user_id = ?').get(userId);
    if (!account) {
      throw new Error('LinkedIn account not connected');
    }
    if (account.expires_at < Date.now()) {
      throw new Error('LinkedIn access token has expired, please reconnect');
    }
    return {
      token: decrypt(account.access_token_encrypted),
      sub: account.linkedin_sub,
      scope: account.scope
    };
  }
}

export const linkedinOAuthService = new LinkedInOAuthService();
