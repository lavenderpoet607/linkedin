import { config } from '../config.js';
import { mcpClientService } from './mcpClientService.js';
import { linkedinApiService } from './linkedinApiService.js';
import { linkedinOAuthService } from './linkedinOAuthService.js';

export class LinkedInIntegrationAdapter {
  constructor(mcpService = mcpClientService, restService = linkedinApiService, oauthService = linkedinOAuthService) {
    this.mcp = mcpService;
    this.rest = restService;
    this.oauth = oauthService;
  }

  getIntegrationStatus(userId) {
    const oauthStatus = this.oauth.getAccountStatus(userId);
    const mcpConfigured = this.mcp.isConfigured() && config.mcp.enabled;

    return {
      connected: oauthStatus.connected,
      name: oauthStatus.name,
      email: oauthStatus.email,
      pictureUrl: oauthStatus.pictureUrl || null,
      picture_url: oauthStatus.pictureUrl || null,
      scope: oauthStatus.scope,
      accountName: oauthStatus.name,
      accountEmail: oauthStatus.email,
      scopes: oauthStatus.scope,
      isExpired: oauthStatus.isExpired,
      effectiveMode: mcpConfigured ? 'mcp' : 'rest_api',
      mcp: {
        configured: mcpConfigured,
        enabled: config.mcp.enabled,
        serverUrl: config.mcp.serverUrl || null,
        tools: this.mcp.getAvailableTools(),
        officialAvailabilityNotice: 'LinkedIn Developer Portal preview feature (Develop with MCP) requires portal login and token generation. When not configured, the system uses the official LinkedIn REST API fallback.'
      },
      rest: {
        available: true,
        protocol: 'LinkedIn REST API v2 / Community Management API',
        endpoints: {
          userInfo: 'https://api.linkedin.com/v2/userinfo',
          posts: 'https://api.linkedin.com/rest/posts'
        }
      },
      permissions: {
        readProfileBasic: oauthStatus.scope.includes('openid') || oauthStatus.scope.includes('profile'),
        readEmail: oauthStatus.scope.includes('email'),
        writeMemberSocial: oauthStatus.scope.includes('w_member_social'),
        writeProfileSectionsDirectly: false
      }
    };
  }

  async publishPost(userId, { text, idempotencyKey, userApproved = false }) {
    if (!userApproved) {
      throw new Error('Impactful external action requires explicit user approval before publishing');
    }

    if (config.mcp.enabled && this.mcp.isConfigured()) {
      return this.mcp.callTool('linkedin_create_share', {
        userId,
        text,
        idempotencyKey,
        userApproved: true
      });
    }

    return this.rest.publishMemberShare(userId, {
      text,
      idempotencyKey
    });
  }

  getUpdateGuidance() {
    return this.rest.getProfileUpdateGuidance();
  }
}

export const linkedinIntegrationAdapter = new LinkedInIntegrationAdapter();
