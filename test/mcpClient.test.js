import test from 'node:test';
import assert from 'node:assert/strict';
import { McpClientService, ALLOWED_MCP_TOOLS } from '../src/services/mcpClientService.js';

test('MCP Client: Tool discovery and metadata expose allowlist accurately', () => {
  const client = new McpClientService();
  const tools = client.getAvailableTools();

  assert.equal(tools.length, 3);
  const toolNames = tools.map((t) => t.name);
  assert.ok(toolNames.includes('linkedin_get_profile_basic'));
  assert.ok(toolNames.includes('linkedin_get_network_status'));
  assert.ok(toolNames.includes('linkedin_create_share'));

  const shareTool = tools.find((t) => t.name === 'linkedin_create_share');
  assert.equal(shareTool.isMutating, true);
  assert.equal(shareTool.requiresUserApproval, true);

  const profileTool = tools.find((t) => t.name === 'linkedin_get_profile_basic');
  assert.equal(profileTool.isMutating, false);
  assert.equal(profileTool.requiresUserApproval, false);
});

test('MCP Client: Rejects tools not present in explicit allowlist', async () => {
  const client = new McpClientService({
    mockTransport: async (name, params) => ({ result: 'ok' })
  });

  await assert.rejects(
    async () => {
      await client.callTool('malicious_shell_exec', { cmd: 'whoami' });
    },
    /Tool "malicious_shell_exec" is not in the allowed MCP tools list/
  );
});

test('MCP Client: Validates parameter schema before execution', async () => {
  const client = new McpClientService({
    mockTransport: async (name, params) => ({ result: 'ok' })
  });

  await assert.rejects(
    async () => {
      await client.callTool('linkedin_get_profile_basic', { userId: '' });
    },
    /Invalid input schema for MCP tool linkedin_get_profile_basic/
  );
});

test('MCP Client: Requires user approval for mutating actions', async () => {
  const client = new McpClientService({
    mockTransport: async (name, params) => ({ result: 'ok' })
  });

  await assert.rejects(
    async () => {
      await client.callTool('linkedin_create_share', {
        userId: 'usr_123',
        text: 'Hello world',
        idempotencyKey: 'idem_456',
        userApproved: false
      });
    },
    /Invalid input schema for MCP tool linkedin_create_share/
  );

  const successResult = await client.callTool('linkedin_create_share', {
    userId: 'usr_123',
    text: 'Hello world',
    idempotencyKey: 'idem_456',
    userApproved: true
  });

  assert.deepEqual(successResult, { result: 'ok' });
});

test('MCP Client: Enforces maximum response byte limit on transport payloads', async () => {
  const oversizedPayload = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    result: { data: 'x'.repeat(70000) }
  });

  const mockFetch = async () => ({
    ok: true,
    status: 200,
    text: async () => oversizedPayload
  });

  const client = new McpClientService({
    serverUrl: 'http://localhost:9999/mcp',
    fetchImpl: mockFetch
  });

  await assert.rejects(
    async () => {
      await client.callTool('linkedin_get_profile_basic', { userId: 'usr_123' });
    },
    /MCP response size exceeds safe limit/
  );
});

test('MCP Client: Enforces timeout and aborts hanging operations', async () => {
  const hangingFetch = async (url, opts) => {
    return new Promise((resolve, reject) => {
      opts.signal.addEventListener('abort', () => {
        const error = new Error('The operation was aborted');
        error.name = 'AbortError';
        reject(error);
      });
    });
  };

  const client = new McpClientService({
    serverUrl: 'http://localhost:9999/mcp',
    fetchImpl: hangingFetch,
    timeoutMs: 50
  });

  await assert.rejects(
    async () => {
      await client.callTool('linkedin_get_profile_basic', { userId: 'usr_123' });
    },
    /MCP tool call timed out after 50ms/
  );
});
