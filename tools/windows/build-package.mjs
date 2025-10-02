#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const serverDir = path.join(rootDir, 'server');
const frontendDir = path.join(rootDir, 'frontend');
const outputDir = path.join(rootDir, 'dist', 'windows-bundle');

const nodeMajor = Number(process.versions.node.split('.')[0]);
if (Number.isNaN(nodeMajor) || nodeMajor < 18) {
  console.error(`Node.js >= 18 é necessário para gerar o pacote. Versão atual: ${process.versions.node}`);
  process.exit(1);
}

function run(command, options = {}) {
  execSync(command, { stdio: 'inherit', ...options });
}

async function prepare() {
  console.log('> Cleaning previous bundle');
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });
}

async function buildProjects() {
  console.log('> Ensuring dependencies and building server');
  run('npm install', { cwd: serverDir });
  run('npm run build', { cwd: serverDir });

  console.log('> Ensuring dependencies and building frontend');
  run('npm install', { cwd: frontendDir });
  run('npm run build', { cwd: frontendDir, env: { ...process.env, NEXT_DISABLE_ESLINT: '1' } });
}

async function bundleServer() {
  const dest = path.join(outputDir, 'server');
  await mkdir(dest, { recursive: true });

  await cp(path.join(serverDir, 'dist'), path.join(dest, 'dist'), { recursive: true });
  await cp(path.join(serverDir, 'package.json'), path.join(dest, 'package.json'));
  await cp(path.join(serverDir, 'package-lock.json'), path.join(dest, 'package-lock.json'));
  await cp(path.join(serverDir, '.env.example'), path.join(dest, '.env.example'));

  console.log('> Installing production dependencies for server bundle');
  run('npm ci --omit=dev', { cwd: dest });
}

async function bundleFrontend() {
  const dest = path.join(outputDir, 'frontend');
  await mkdir(dest, { recursive: true });

  await cp(path.join(frontendDir, '.next'), path.join(dest, '.next'), { recursive: true });
  await cp(path.join(frontendDir, 'public'), path.join(dest, 'public'), { recursive: true });
  await cp(path.join(frontendDir, 'next.config.js'), path.join(dest, 'next.config.js'));
  await cp(path.join(frontendDir, 'package.json'), path.join(dest, 'package.json'));
  await cp(path.join(frontendDir, 'package-lock.json'), path.join(dest, 'package-lock.json'));
  await cp(path.join(frontendDir, '.env.example'), path.join(dest, '.env.example'));

  console.log('> Installing production dependencies for frontend bundle');
  run('npm ci --omit=dev', { cwd: dest });
}

async function createScripts() {
  const startBat = `@echo off
setlocal
set BASEDIR=%~dp0
set NODE_DIR=%BASEDIR%node
if exist "%NODE_DIR%\node.exe" (
  set PATH=%NODE_DIR%;%PATH%
)
start "Luzes Arbitros Server" cmd /k "cd /d %BASEDIR%server && node dist/index.js"
timeout /t 2 >nul
start "Luzes Arbitros Frontend" cmd /k "cd /d %BASEDIR%frontend && node node_modules\\next\\dist\\bin\\next start -p 3000"
cls
@echo Servicos iniciados. As janelas permanecerao abertas. Pressione Ctrl+C nelas para encerrar.
`;

  const startSh = `#!/usr/bin/env bash
set -euo pipefail
BASEDIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_DIR="$BASEDIR/node"
if [ -x "$NODE_DIR/node" ]; then
  export PATH="$NODE_DIR:$PATH"
fi
trap 'kill 0' EXIT
(cd "$BASEDIR/server" && node dist/index.js) &
sleep 2
(cd "$BASEDIR/frontend" && node node_modules/next/dist/bin/next start -p 3000) &
wait
`;

  await writeFile(path.join(outputDir, 'start.bat'), startBat, 'utf8');
  await writeFile(path.join(outputDir, 'start.sh'), startSh, { encoding: 'utf8', mode: 0o755 });
  await writeFile(path.join(outputDir, 'stop.txt'), 'Para encerrar, feche as janelas de console ou pressione Ctrl+C nelas.');

  const readme = `# Pacote Windows

1. Baixe o Node.js Windows (zip x64) em https://nodejs.org/en/download/prebuilt-installer e extraia o conteudo da pasta para ./node deste pacote (o executavel deve ficar em node\\node.exe).
2. Renomeie server\\.env.example -> server\\.env e ajuste as variaveis.
3. Renomeie frontend\\.env.example -> frontend\\.env.local (pode manter vazio para usar padroes).
4. Execute start.bat. Duas janelas de console abrirao (backend e frontend). Use o IP da maquina na rede com porta 3000 para acessar.
5. Para encerrar, feche as janelas de console ou pressione Ctrl+C em cada uma.
`;
  await writeFile(path.join(outputDir, 'README.txt'), readme, 'utf8');

  const nodeDir = path.join(outputDir, 'node');
  await mkdir(nodeDir, { recursive: true });
  await writeFile(
    path.join(nodeDir, 'COLOQUE_NODE_AQUI.txt'),
    'Extraia aqui o conteudo do zip "node-vXX.X.X-win-x64" (deve conter node.exe).',
    'utf8'
  );
}

async function main() {
  await prepare();
  await buildProjects();
  await bundleServer();
  await bundleFrontend();
  await createScripts();
  console.log(`\nPacote pronto em ${outputDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
