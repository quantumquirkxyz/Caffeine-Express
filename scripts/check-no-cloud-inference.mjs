#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();

const SCAN_DIRS = ['src/capture', 'scripts'];
const SCAN_EXT = new Set(['.ts', '.tsx', '.mts', '.cts', '.mjs', '.js']);
const PROMPT_FILE = join(ROOT, 'src/capture/qvac-smoke.ts');

const FORBIDDEN = [
  { id: 'fetch-call', re: /\bfetch\s*\(/ },
  { id: 'xhr', re: /XMLHttpRequest/ },
  { id: 'axios-import', re: /from\s+['"]axios['"]/ },
  { id: 'node-fetch-import', re: /from\s+['"]node-fetch['"]/ },
  { id: 'openai-import', re: /from\s+['"](openai|@openai\/[^'"]+)['"]/i },
  { id: 'anthropic-import', re: /from\s+['"](@anthropic\/[^'"]+|anthropic)['"]/i },
  { id: 'cloud-url', re: /https?:\/\/(?!localhost|127\.0\.0\.1)/i },
];

function walk(dir, acc) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const st = statSync(path);
    if (st.isDirectory()) {
      walk(path, acc);
    } else if (st.isFile()) {
      const dot = path.lastIndexOf('.');
      if (dot >= 0 && SCAN_EXT.has(path.slice(dot))) acc.push(path);
    }
  }
  return acc;
}

function stripComments(source) {
  let out = source.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  out = out.replace(/(^|[^:\\])\/\/[^\n]*/g, (m, p1) => p1 + ''.padEnd(m.length - p1.length, ' '));
  return out;
}

const offences = [];
const SELF = relative(ROOT, new URL(import.meta.url).pathname);

for (const rel of SCAN_DIRS) {
  const abs = join(ROOT, rel);
  let files;
  try {
    files = walk(abs, []);
  } catch {
    continue;
  }
  for (const file of files) {
    if (relative(ROOT, file) === SELF) continue;
    const text = stripComments(readFileSync(file, 'utf8'));
    text.split(/\r?\n/).forEach((line, idx) => {
      for (const { id, re } of FORBIDDEN) {
        if (re.test(line)) {
          offences.push({ file: relative(ROOT, file), line: idx + 1, id, snippet: line.trim() });
        }
      }
    });
  }
}

try {
  const smoke = readFileSync(PROMPT_FILE, 'utf8');
  const match = smoke.match(/QVAC_SMOKE_FIELD_NOTE\s*=\s*'([^']*)'/);
  if (match) {
    const prompt = match[1];
    for (const { id, re } of FORBIDDEN) {
      if (re.test(prompt)) {
        offences.push({ file: relative(ROOT, PROMPT_FILE), line: 0, id, snippet: 'QVAC_SMOKE_FIELD_NOTE' });
      }
    }
  }
} catch (error) {
  offences.push({ file: relative(ROOT, PROMPT_FILE), line: 0, id: 'read-error', snippet: String(error) });
}

if (offences.length > 0) {
  console.error('no-cloud-inference check FAILED. Forbidden patterns found:');
  for (const o of offences) {
    console.error(`  ${o.file}:${o.line} [${o.id}] ${o.snippet}`);
  }
  process.exit(1);
}

console.log('no-cloud-inference check passed: no cloud HTTP, fetch, or inference SDK imports in QVAC source.');
