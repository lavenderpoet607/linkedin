import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export function generateSecretHex(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

export function ensureEnvironmentSecrets(envPath = path.resolve('.env')) {
  let content = '';
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf8');
  } else {
    const examplePath = path.resolve('.env.example');
    if (fs.existsSync(examplePath)) {
      content = fs.readFileSync(examplePath, 'utf8');
    }
  }

  const lines = content.split('\n');
  let hasAppSecret = false;
  let hasEncKey = false;
  const newLines = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('APP_SECRET=')) {
      const val = trimmed.split('=')[1] || '';
      if (!val || val.includes('replace_with') || val.length < 64) {
        newLines.push(`APP_SECRET=${generateSecretHex(32)}`);
      } else {
        newLines.push(line);
      }
      hasAppSecret = true;
    } else if (trimmed.startsWith('ENCRYPTION_KEY=')) {
      const val = trimmed.split('=')[1] || '';
      if (!val || val.includes('replace_with') || val.length < 64) {
        newLines.push(`ENCRYPTION_KEY=${generateSecretHex(32)}`);
      } else {
        newLines.push(line);
      }
      hasEncKey = true;
    } else {
      newLines.push(line);
    }
  }

  if (!hasAppSecret) {
    newLines.push(`APP_SECRET=${generateSecretHex(32)}`);
  }
  if (!hasEncKey) {
    newLines.push(`ENCRYPTION_KEY=${generateSecretHex(32)}`);
  }

  fs.writeFileSync(envPath, newLines.join('\n'));
}

if (process.argv[1] && process.argv[1].endsWith('generateSecrets.js')) {
  ensureEnvironmentSecrets();
}
