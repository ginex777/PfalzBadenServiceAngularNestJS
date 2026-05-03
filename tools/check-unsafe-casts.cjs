const { readdirSync, readFileSync, statSync } = require('node:fs');
const { join } = require('node:path');

const roots = ['pbs-backend/src', 'pbs-webapp/src', 'pbs-mobile/src'];
const extensions = new Set(['.ts', '.tsx']);
const forbiddenPatterns = [
  {
    label: 'as unknown as',
    pattern: /\bas\s+unknown\s+as\b/,
  },
];

function extensionOf(path) {
  const dot = path.lastIndexOf('.');
  return dot === -1 ? '' : path.slice(dot);
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (!['.angular', 'coverage', 'dist', 'node_modules'].includes(entry)) {
        walk(fullPath, files);
      }
    } else if (extensions.has(extensionOf(fullPath))) {
      files.push(fullPath);
    }
  }
  return files;
}

const findings = [];
for (const root of roots) {
  for (const file of walk(root)) {
    const lines = readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, index) => {
      for (const forbidden of forbiddenPatterns) {
        if (forbidden.pattern.test(line)) {
          findings.push(`${file}:${index + 1}: forbidden ${forbidden.label}: ${line.trim()}`);
        }
      }
    });
  }
}

if (findings.length > 0) {
  console.error(`Unsafe cast scan failed with ${findings.length} finding(s):`);
  console.error(findings.join('\n'));
  process.exit(1);
}

console.log('Unsafe cast scan passed.');
