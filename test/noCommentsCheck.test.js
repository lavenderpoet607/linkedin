import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

function findFiles(dir, fileList = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (item === 'node_modules' || item === '.git' || item === 'data') continue;
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      findFiles(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const slashStar = String.fromCharCode(47, 42);
const starSlash = String.fromCharCode(42, 47);
const doubleSlash = String.fromCharCode(47, 47);
const htmlCommentStart = String.fromCharCode(60, 33, 45, 45);
const htmlCommentEnd = String.fromCharCode(45, 45, 62);

test('Verification: Zero comments in all codebase files', () => {
  const root = path.resolve('.');
  const files = findFiles(root);
  const violations = [];

  for (const file of files) {
    const ext = path.extname(file);
    if (!['.js', '.json', '.html', '.css', '.env', '.example', '.md'].includes(ext) && !file.endsWith('.env.example') && !file.endsWith('.env')) {
      continue;
    }

    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      if (['.js', '.css', '.html'].includes(ext)) {
        if (file.endsWith('noCommentsCheck.test.js')) {
          return;
        }
        if (trimmed.startsWith(doubleSlash)) {
          violations.push(`${file}:${index + 1} has double-slash comment: ${trimmed}`);
        }
        if (trimmed.includes(slashStar) || trimmed.includes(starSlash)) {
          violations.push(`${file}:${index + 1} has block comment: ${trimmed}`);
        }
      }

      if (ext === '.html') {
        if (trimmed.includes(htmlCommentStart) || trimmed.includes(htmlCommentEnd)) {
          violations.push(`${file}:${index + 1} has HTML comment: ${trimmed}`);
        }
      }

      if (file.endsWith('.env') || file.endsWith('.env.example')) {
        if (trimmed.startsWith('#')) {
          violations.push(`${file}:${index + 1} has hash comment: ${trimmed}`);
        }
      }
    });
  }

  assert.equal(
    violations.length,
    0,
    `Found forbidden comments:\n${violations.join('\n')}`
  );
});
