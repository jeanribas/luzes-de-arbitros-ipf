import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const configs = ['tsconfig.build.json', 'tsconfig.json'];

function runTsc(config) {
  const result = spawnSync('node', ['node_modules/typescript/lib/tsc.js', '-p', config], {
    stdio: 'inherit'
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const chosenConfig = configs.find((file) => existsSync(file));

if (!chosenConfig) {
  console.log('No tsconfig file found, assuming prebuilt dist/. Skipping TypeScript build.');
  process.exit(0);
}

if (chosenConfig !== configs[0]) {
  console.log('tsconfig.build.json not found, falling back to tsconfig.json.');
}

runTsc(chosenConfig);
