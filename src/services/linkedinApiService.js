import dotenv from 'dotenv';
import { linkedinOAuthService } from './linkedinOAuthService.js';
import { logger } from '../utils/logger.js';
import { getDb } from '../db/database.js';
import { generateId } from './cryptoService.js';
import { config } from '../config.js';

export class LinkedInApiService {
  constructor(fetchImpl = fetch) {
    this.fetch = fetchImpl;
  }

  async publishMemberShare(userId, { text, idempotencyKey }) {
    try {
      dotenv.config({ override: true });
    } catch {}
    const db = getDb();
    const { token, sub, scope } = linkedinOAuthService.getDecryptedAccessToken(userId);

    const scopesList = scope ? (Array.isArray(scope) ? scope : scope.split(/[,\s]+/).filter(Boolean)) : [];
    if (!scopesList.includes('w_member_social')) {
      throw new Error('Permission w_member_social is not granted for this account');
    }

    const existingDraft = db
      .prepare('SELECT * FROM post_drafts WHERE idempotency_key = ? AND user_id = ?')
      .get(idempotencyKey, userId);

    if (existingDraft && existingDraft.status === 'published' && existingDraft.linkedin_post_urn) {
      return {
        alreadyPublished: true,
        postUrn: existingDraft.linkedin_post_urn,
        message: 'This draft was already published with this idempotency key'
      };
    }

    const payload = {
      author: `urn:li:person:${sub}`,
      commentary: text,
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: []
      },
      lifecycleState: 'PUBLISHED',
      isReshareDisabledByAuthor: false
    };

    let lastError = null;
    const maxRetries = 3;
    const apiVersion = process.env.LINKEDIN_API_VERSION || config.linkedin.apiVersion || '202609';

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.fetch('https://api.linkedin.com/rest/posts', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0',
            'LinkedIn-Version': apiVersion
          },
          body: JSON.stringify(payload)
        });

        if (response.status === 429) {
          const retryAfterHeader = response.headers.get('Retry-After');
          const delaySec = retryAfterHeader ? parseInt(retryAfterHeader, 10) : attempt * 2;
          logger.warn('LinkedIn API rate limited (429)', { attempt, delaySec });
          if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, delaySec * 1000));
            continue;
          }
          throw new Error('LinkedIn API rate limit reached, please retry later');
        }

        if (!response.ok) {
          const errBody = await response.text();
          logger.error('LinkedIn API request failed', { status: response.status, attempt });
          if (response.status >= 500 && attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
            continue;
          }
          throw new Error(`LinkedIn share failed with status ${response.status}: ${errBody}`);
        }

        const postUrn = response.headers.get('x-restli-id') || `urn:li:share:${Date.now()}`;
        const now = new Date().toISOString();

        if (existingDraft) {
          db.prepare(
            `UPDATE post_drafts
             SET status = 'published', published_at = ?, linkedin_post_urn = ?
             WHERE id = ?`
          ).run(now, postUrn, existingDraft.id);
        } else {
          db.prepare(
            `INSERT INTO post_drafts
             (id, user_id, topic, content, status, idempotency_key, published_at, linkedin_post_urn, created_at)
             VALUES (?, ?, ?, ?, 'published', ?, ?, ?, ?)`
          ).run(generateId(), userId, 'Instant Member Share', text, idempotencyKey, now, postUrn, now);
        }

        db.prepare(
          `INSERT INTO activity_logs (id, user_id, action_type, status, details_json, created_at)
           VALUES (?, ?, 'linkedin_share_published', 'success', ?, ?)`
        ).run(generateId(), userId, JSON.stringify({ postUrn, length: text.length }), now);

        return {
          success: true,
          postUrn,
          publishedAt: now
        };
      } catch (err) {
        lastError = err;
        if (attempt === maxRetries) break;
      }
    }

    throw lastError || new Error('Failed to post share to LinkedIn after retries');
  }

  getProfileUpdateGuidance() {
    return {
      allowedViaApi: false,
      reason: 'LinkedIn Developer Terms and Member Data policies restrict direct programmatic mutation of member profile sections (Headline, Summary, Experience, Education) for general OAuth apps.',
      solution: 'Use our 1-click clipboard export or Markdown/TXT download to update your profile in LinkedIn settings.',
      steps: [
        'Review optimized sections in the Profile Optimizer dashboard.',
        'Copy your chosen Headline and About text using the Copy button.',
        'Open LinkedIn in your browser and click View Profile.',
        'Click the pencil icon next to Intro to paste the optimized Headline.',
        'Scroll to About section and click the pencil icon to update Summary.',
        'Update Experience bullet points with the grounded STAR metrics provided.'
      ]
    };
  }
}

export const linkedinApiService = new LinkedInApiService();
