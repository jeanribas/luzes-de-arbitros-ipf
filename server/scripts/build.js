import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const configs = ['tsconfig.build.json', 'tsconfig.json'];
const TSC_PATH = 'node_modules/typescript/lib/tsc.js';
const PREBUILT_DIST_ENTRY = 'dist/index.js';

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

if (!existsSync(TSC_PATH)) {
  if (existsSync(PREBUILT_DIST_ENTRY)) {
    console.log('TypeScript compiler not found. Using prebuilt dist/ artifacts.');
    process.exit(0);
  }

  console.error(
    'TypeScript compiler not found and dist/ is missing. ' +
      'Install devDependencies or ship prebuilt dist/.'
  );
  process.exit(1);
}

runTsc(chosenConfig);
