import { z } from 'zod';
import { logger } from '../utils/logger.js';

export const ALLOWED_MCP_TOOLS = {
  linkedin_get_profile_basic: {
    name: 'linkedin_get_profile_basic',
    description: 'Retrieve verified basic OpenID member profile identity',
    isMutating: false,
    inputSchema: z.object({
      userId: z.string().min(1)
    })
  },
  linkedin_get_network_status: {
    name: 'linkedin_get_network_status',
    description: 'Check active permissions and token lifetime',
    isMutating: false,
    inputSchema: z.object({
      userId: z.string().min(1)
    })
  },
  linkedin_create_share: {
    name: 'linkedin_create_share',
    description: 'Publish a member text post to LinkedIn main feed',
    isMutating: true,
    requiresUserApproval: true,
    inputSchema: z.object({
      userId: z.string().min(1),
      text: z.string().min(1).max(3000),
      idempotencyKey: z.string().min(1),
      userApproved: z.literal(true)
    })
  }
};

const MAX_RESPONSE_BYTES = 65536;
const DEFAULT_TIMEOUT_MS = 8000;

export class McpClientService {
  constructor(options = {}) {
    this.serverUrl = options.serverUrl || null;
    this.fetchImpl = options.fetchImpl || fetch;
    this.timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
    this.mockTransport = options.mockTransport || null;
  }

  isConfigured() {
    return Boolean(this.serverUrl || this.mockTransport);
  }

  getAvailableTools() {
    return Object.values(ALLOWED_MCP_TOOLS).map((tool) => ({
      name: tool.name,
      description: tool.description,
      isMutating: tool.isMutating,
      requiresUserApproval: Boolean(tool.requiresUserApproval)
    }));
  }

  async callTool(toolName, params) {
    const toolDef = ALLOWED_MCP_TOOLS[toolName];
    if (!toolDef) {
      throw new Error(`Tool "${toolName}" is not in the allowed MCP tools list`);
    }

    const validationResult = toolDef.inputSchema.safeParse(params);
    if (!validationResult.success) {
      const issueDetails = validationResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
      throw new Error(`Invalid input schema for MCP tool ${toolName}: ${issueDetails}`);
    }

    if (toolDef.isMutating && toolDef.requiresUserApproval && params.userApproved !== true) {
      throw new Error(`Action ${toolName} requires explicit user approval before execution`);
    }

    if (this.mockTransport) {
      return this.mockTransport(toolName, validationResult.data);
    }

    if (!this.serverUrl) {
      throw new Error('LinkedIn MCP server URL is not configured. Falling back to official REST API.');
    }

    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const rpcPayload = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: validationResult.data
        }
      };

      const response = await this.fetchImpl(this.serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(rpcPayload),
        signal: controller.signal
      });

      clearTimeout(timeoutHandle);

      if (!response.ok) {
        throw new Error(`MCP server returned HTTP ${response.status}`);
      }

      const text = await response.text();
      if (text.length > MAX_RESPONSE_BYTES) {
        throw new Error(`MCP response size exceeds safe limit (${text.length} > ${MAX_RESPONSE_BYTES} bytes)`);
      }

      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (err) {
        throw new Error('MCP server returned malformed JSON');
      }

      if (parsed.error) {
        throw new Error(`MCP error ${parsed.error.code}: ${parsed.error.message}`);
      }

      return parsed.result;
    } catch (err) {
      clearTimeout(timeoutHandle);
      if (err.name === 'AbortError') {
        throw new Error(`MCP tool call timed out after ${this.timeoutMs}ms`);
      }
      logger.warn('MCP tool execution error', { toolName, message: err.message });
      throw err;
    }
  }
}

export const mcpClientService = new McpClientService();
