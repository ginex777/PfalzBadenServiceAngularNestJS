const { spawnSync } = require('node:child_process');
const { join, resolve } = require('node:path');

const passthroughArgs = process.argv.slice(2).filter((arg) => arg !== '--run');
const args = ['ng', 'test', '--watch=false', ...passthroughArgs];
const projectRoot = resolve(__dirname, '..', 'pbs-webapp');
const cliPath = join(projectRoot, 'node_modules', '@angular', 'cli', 'bin', 'ng.js');

const result = spawnSync(process.execPath, [cliPath, ...args.slice(1)], {
  cwd: projectRoot,
  stdio: 'inherit',
});

if (result.error) {
  console.error(result.error.message);
}

process.exit(result.status ?? 1);
