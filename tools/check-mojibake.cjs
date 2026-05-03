const { readdirSync, readFileSync, statSync } = require('node:fs');
const { join } = require('node:path');

const roots = ['pbs-backend/src', 'pbs-webapp/src', 'pbs-mobile/src'];
const patterns = [/Ã/, /Â/, /â‚¬/, /â€“/, /â€”/, /â€¦/, /â†/, /âœ/];
const extensions = new Set(['.ts', '.html', '.scss', '.css', '.md', '.json']);

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
    const content = readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (patterns.some((pattern) => pattern.test(line))) {
        findings.push(`${file}:${index + 1}: ${line.trim()}`);
      }
    });
  }
}

if (findings.length > 0) {
  console.error(`Mojibake scan failed with ${findings.length} finding(s):`);
  console.error(findings.join('\n'));
  process.exit(1);
}

console.log('Mojibake scan passed.');
