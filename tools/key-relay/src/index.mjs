import 'dotenv/config';

import { io } from 'socket.io-client';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';

const DEFAULT_HOST = 'http://localhost:3333';
const TRIGGER_DELAY_MS = Number.parseInt(process.env.TRIGGER_DELAY_MS ?? '', 10) || 1600;

const FUNCTION_KEY_DEFINITIONS = {
  F1: { macKeyCode: 122, winSequence: '{F1}', linuxSequence: 'F1' },
  F2: { macKeyCode: 120, winSequence: '{F2}', linuxSequence: 'F2' },
  F3: { macKeyCode: 99, winSequence: '{F3}', linuxSequence: 'F3' },
  F4: { macKeyCode: 118, winSequence: '{F4}', linuxSequence: 'F4' },
  F5: { macKeyCode: 96, winSequence: '{F5}', linuxSequence: 'F5' },
  F6: { macKeyCode: 97, winSequence: '{F6}', linuxSequence: 'F6' },
  F7: { macKeyCode: 98, winSequence: '{F7}', linuxSequence: 'F7' },
  F8: { macKeyCode: 100, winSequence: '{F8}', linuxSequence: 'F8' },
  F9: { macKeyCode: 101, winSequence: '{F9}', linuxSequence: 'F9' },
  F10: { macKeyCode: 109, winSequence: '{F10}', linuxSequence: 'F10' },
  F11: { macKeyCode: 103, winSequence: '{F11}', linuxSequence: 'F11' },
  F12: { macKeyCode: 111, winSequence: '{F12}', linuxSequence: 'F12' }
};

const DEFAULT_VALID_KEY = 'F1';
const DEFAULT_INVALID_KEY = 'F10';

const fileConfig = loadConfigFile();

let shortcutKeys = {
  valid: normalizeKey(fileConfig.validKey ?? process.env.VALID_KEY ?? DEFAULT_VALID_KEY) ?? DEFAULT_VALID_KEY,
  invalid: normalizeKey(fileConfig.invalidKey ?? process.env.INVALID_KEY ?? DEFAULT_INVALID_KEY) ?? DEFAULT_INVALID_KEY
};

let keyDefinitions = null;

const argv = yargs(hideBin(process.argv))
  .option('ws', {
    alias: 'w',
    type: 'string',
    describe: 'Endpoint Socket.IO do backend',
    default: fileConfig.ws ?? process.env.WS_URL ?? DEFAULT_HOST
  })
  .option('api', {
    alias: 'a',
    type: 'string',
    describe: 'Base HTTP usada para validar o PIN',
    default: fileConfig.api ?? process.env.API_URL ?? process.env.WS_URL ?? DEFAULT_HOST
  })
  .option('room', {
    alias: 'r',
    type: 'string',
    describe: 'roomId da sessão que será monitorada',
    default: fileConfig.room ?? process.env.ROOM_ID
  })
  .option('pin', {
    alias: 'p',
    type: 'string',
    describe: 'PIN administrativo usado para validar o acesso (opcional)',
    default: fileConfig.pin ?? process.env.ADMIN_PIN
  })
  .option('session-url', {
    alias: 's',
    type: 'string',
    describe: 'Link completo do display/admin (usa roomId e pin da query string)',
    default: fileConfig.sessionUrl ?? process.env.SESSION_URL
  })
  .option('skip-verify', {
    type: 'boolean',
    describe: 'Ignora a validação HTTP mesmo com PIN informado',
    default: false
  })
  .option('valid-key', {
    type: 'string',
    describe: 'Tecla usada para decisão válida (ex.: F1)',
    default: shortcutKeys.valid
  })
  .option('invalid-key', {
    type: 'string',
    describe: 'Tecla usada para decisão inválida (ex.: F10)',
    default: shortcutKeys.invalid
  })
  .alias('h', 'help')
  .help()
  .strict()
.parse();

const runtimeConfig = await ensureInteractiveConfig(argv);

shortcutKeys = {
  valid: normalizeKey(runtimeConfig.validKey ?? DEFAULT_VALID_KEY),
  invalid: normalizeKey(runtimeConfig.invalidKey ?? DEFAULT_INVALID_KEY)
};

try {
  keyDefinitions = buildKeyDefinitions(shortcutKeys);
} catch (error) {
  console.error(error?.message ?? error);
  process.exit(1);
}

const wsUrl = trimTrailingSlash(runtimeConfig.ws);
const apiUrl = trimTrailingSlash(runtimeConfig.api ?? runtimeConfig.ws);

let lastDecision = 'none';
let pendingKeyTimeout = null;

void main();

async function main() {
  printBanner();
  if (fileConfig.source) {
    log(`Configurações carregadas automaticamente de ${fileConfig.source}.`);
  }
  log(`Servidor Socket.IO: ${wsUrl}`);
  if (apiUrl !== wsUrl) {
    log(`Servidor HTTP: ${apiUrl}`);
  }
  log(`Sala monitorada: ${runtimeConfig.room}`);
  log(runtimeConfig.pin ? 'PIN admin informado. Será verificado antes da conexão.' : 'PIN admin não informado. Seguiremos sem verificação prévia.');
  log(`Atalhos configurados: válido → ${shortcutKeys.valid}, inválido → ${shortcutKeys.invalid}`);

  try {
    if (runtimeConfig.pin && !argv.skipVerify) {
      await verifyAccess(apiUrl, runtimeConfig.room, runtimeConfig.pin);
      log('roomId/PIN verificados com sucesso.');
    } else if (!runtimeConfig.pin) {
      log('Pulando validação de PIN (não informado).');
    } else {
      log('Validação ignorada por --skip-verify.');
    }
  } catch (error) {
    console.error('Falha ao validar credenciais:', error?.message ?? error);
    process.exit(1);
  }

  const socket = io(wsUrl, {
    transports: ['websocket'],
    autoConnect: false
  });

  socket.on('connect', () => {
    log('Socket conectado. Registrando como viewer…');
    socket.emit(
      'client:register',
      { role: 'viewer', roomId: runtimeConfig.room },
      (response) => {
        if (response && 'error' in response) {
          console.error('Registro rejeitado pelo servidor:', response.error);
          socket.disconnect();
          process.exit(1);
          return;
        }
        log('Registro aceito; aguardando decisões.');
      }
    );
  });

  socket.on('disconnect', (reason) => {
    log(`Socket desconectado (${reason}). Tentando reconectar automaticamente…`);
  });

  socket.on('connect_error', (error) => {
    console.error('Erro de conexão Socket.IO:', error?.message ?? error);
  });

  socket.on('state:update', (snapshot) => {
    try {
      handleState(snapshot);
    } catch (error) {
      console.error('Erro ao processar state:update:', error);
    }
  });

  socket.connect();
}

async function verifyAccess(apiBaseUrl, roomId, pin) {
  const url = `${apiBaseUrl}/rooms/${encodeURIComponent(roomId)}/access`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminPin: pin })
  });

  if (!response.ok) {
    const payload = await safeJson(response);
    const errorCode = payload?.error ?? response.statusText ?? 'request_failed';
    throw new Error(`${response.status} ${response.statusText ?? ''} (${errorCode})`.trim());
  }
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function handleState(state) {
  if (!state || typeof state !== 'object') {
    return;
  }

  if (state.phase !== 'revealed') {
    if (lastDecision !== 'none' && state.phase === 'idle') {
      log('Estado voltou para idle. Aguardando próxima decisão.');
    }
    lastDecision = 'none';
    return;
  }

  const votes = Object.values(state.votes ?? {});
  const whiteCount = votes.filter((vote) => vote === 'white').length;
  const redCount = votes.filter((vote) => vote === 'red').length;

  let outcome = 'none';
  if (whiteCount >= 2) {
    outcome = 'valid';
  } else if (redCount >= 2) {
    outcome = 'invalid';
  }

  if (outcome === 'none' || outcome === lastDecision) {
    return;
  }

  lastDecision = outcome;
  scheduleKeySend(outcome, { whiteCount, redCount });
}

function scheduleKeySend(outcome, counts) {
  const keyName = outcome === 'valid' ? shortcutKeys.valid : shortcutKeys.invalid;
  const definition = outcome === 'valid' ? keyDefinitions.valid : keyDefinitions.invalid;
  if (pendingKeyTimeout) {
    clearTimeout(pendingKeyTimeout);
    pendingKeyTimeout = null;
  }

  log(
    `Decisão revelada (brancas=${counts.whiteCount}, vermelhas=${counts.redCount}). ` +
      `Enviando ${keyName} em ${TRIGGER_DELAY_MS} ms…`
  );

  pendingKeyTimeout = setTimeout(async () => {
    try {
      await sendKey(definition);
      log(`Tecla ${keyName} enviada com sucesso.`);
    } catch (error) {
      console.error(`Falha ao enviar a tecla ${keyName}:`, error?.message ?? error);
    } finally {
      pendingKeyTimeout = null;
    }
  }, TRIGGER_DELAY_MS);
}

function sendKey(definition) {
  switch (process.platform) {
    case 'darwin':
      return runOsaScript(definition.macKeyCode);
    case 'win32':
      return runPowerShell(definition.winSequence);
    case 'linux':
    default:
      return runXdotool(definition.linuxSequence);
  }
}

function runOsaScript(keyCode) {
  return runCommand('osascript', ['-e', `tell application "System Events" to key code ${keyCode}`], {
    missingHint:
      'Verifique se o Terminal (ou Node) tem permissão em "Acessibilidade" nas Preferências do Sistema.'
  });
}

function runPowerShell(sequence) {
  const command = `$wshell = New-Object -ComObject WScript.Shell; Start-Sleep -Milliseconds 50; $wshell.SendKeys('${sequence}')`;
  return runCommand('powershell', ['-NoLogo', '-NoProfile', '-Command', command], {
    missingHint: 'Certifique-se de executar em um PowerShell com acesso a COM (não funciona no PowerShell Core em sandbox).'
  });
}

function runXdotool(sequence) {
  return runCommand('xdotool', ['key', sequence], {
    missingHint: 'Instale o pacote "xdotool" e garanta que o display X11 esteja acessível.'
  });
}

function runCommand(command, args, { missingHint } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'ignore' });
    child.once('error', (error) => {
      if (error.code === 'ENOENT') {
        const hint = missingHint ? ` ${missingHint}` : '';
        reject(new Error(`Comando "${command}" não encontrado.${hint}`));
      } else {
        reject(error);
      }
    });
    child.once('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Processo "${command}" terminou com código ${code}`));
      }
    });
  });
}

function trimTrailingSlash(value) {
  if (!value) return value;
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function log(...args) {
  const timestamp = new Date().toISOString();
  console.log(timestamp, '-', ...args);
}

async function ensureInteractiveConfig(config) {
  const interactive = process.stdin.isTTY && process.stdout.isTTY;

  if (!interactive) {
    console.error('Este helper precisa ser executado em uma janela de terminal.');
    process.exit(1);
  }

  const rl = createInterface({ input, output });

  const ask = async (question, defaultValue) => {
    const suffix = defaultValue ? ` (${defaultValue})` : '';
    const answer = await rl.question(`${question}${suffix}: `);
    if (!answer && defaultValue !== undefined) {
      return defaultValue;
    }
    return answer.trim();
  };

  let sessionLink = '';
  while (!sessionLink) {
    sessionLink = (await ask('Cole o link do display/admin', config.sessionUrl ?? '')).trim();
  }

  const parsed = parseSessionLink(sessionLink);
  if (!parsed.roomId) {
    rl.close();
    console.error('Não foi possível encontrar roomId no link informado.');
    process.exit(1);
  }

  config.sessionUrl = sessionLink;
  config.room = parsed.roomId.trim().toUpperCase();
  config.pin = parsed.pin ?? config.pin ?? '';
  config.ws = parsed.backendOrigin ?? config.ws ?? DEFAULT_HOST;
  config.api = parsed.backendOrigin ?? config.api ?? config.ws ?? DEFAULT_HOST;

  if (!config.pin) {
    const promptPin = await ask('PIN admin (deixe vazio se não tiver)', '');
    config.pin = promptPin ? promptPin.trim() : undefined;
  }

  rl.close();

  config.ws = (config.ws ?? DEFAULT_HOST).trim() || DEFAULT_HOST;
  config.api = (config.api ?? config.ws).trim() || config.ws;
  config.validKey = normalizeKey(config.validKey ?? shortcutKeys.valid ?? DEFAULT_VALID_KEY) ?? DEFAULT_VALID_KEY;
  config.invalidKey = normalizeKey(config.invalidKey ?? shortcutKeys.invalid ?? DEFAULT_INVALID_KEY) ?? DEFAULT_INVALID_KEY;

  return {
    room: config.room,
    pin: config.pin,
    ws: config.ws,
    api: config.api,
    sessionUrl: config.sessionUrl,
    validKey: config.validKey,
    invalidKey: config.invalidKey
  };
}

function parseSessionLink(value) {
  if (!value) return {};
  try {
    const url = new URL(value.trim());
    const params = url.searchParams;
    const roomId = params.get('roomId')?.toUpperCase() ?? undefined;
    const pin = params.get('pin') ?? undefined;
    const backendOrigin = deriveBackendOrigin(url);
    return {
      roomId,
      pin,
      backendOrigin
    };
  } catch {
    return {};
  }
}

function deriveBackendOrigin(url) {
  if (!url) return DEFAULT_HOST;
  const protocol = url.protocol === 'https:' ? 'https' : 'http';
  const host = url.hostname;
  const port = url.port;

  if (!port || port === '3000') {
    const defaultPort = protocol === 'https' ? '443' : '3333';
    const chosenPort = port && port !== '3000' ? port : defaultPort;
    if (chosenPort === '443') {
      return `${protocol}://${host}`;
    }
    return `${protocol}://${host}:${chosenPort}`;
  }

  return `${protocol}://${host}:${port}`;
}

function normalizeKey(value) {
  if (!value) return undefined;
  return String(value).trim().toUpperCase();
}

function resolveKeyDefinition(keyName) {
  const definition = FUNCTION_KEY_DEFINITIONS[keyName];
  if (!definition) {
    throw new Error(`Tecla "${keyName}" não é suportada. Utilize F1 até F12.`);
  }
  return definition;
}

function buildKeyDefinitions(selection) {
  return {
    valid: resolveKeyDefinition(selection.valid),
    invalid: resolveKeyDefinition(selection.invalid)
  };
}

function printBanner() {
  if (!process.stdout.isTTY) return;
  console.clear();
  console.log('==========================================');
  console.log(' Referee Lights · Key Relay');
  console.log('==========================================');
  console.log('Este helper envia atalhos configuráveis (padrão F1/F10)');
  console.log('quando 2 ou mais árbitros votam branco/vermelho.');
  console.log('Pressione Ctrl+C para encerrar.\n');
}

process.on('SIGINT', () => {
  log('Encerrando helper.');
  process.exit(0);
});

function loadConfigFile() {
  const filenames = ['key-relay-config.json', 'config.json', 'key-relay.config.json', 'key-relay-config.txt'];
  for (const name of filenames) {
    const absolute = resolvePath(process.cwd(), name);
    if (!existsSync(absolute)) continue;
    try {
      const content = readFileSync(absolute, 'utf8').trim();
      let parsed = {};
      if (content.startsWith('{')) {
        parsed = JSON.parse(content);
      } else {
        parsed = parseKeyValueConfig(content);
      }
      const info = {
        validKey: normalizeKey(parsed.validKey ?? parsed.VALID_KEY ?? parsed.validShortcut ?? parsed.shortcuts?.valid),
        invalidKey: normalizeKey(parsed.invalidKey ?? parsed.INVALID_KEY ?? parsed.invalidShortcut ?? parsed.shortcuts?.invalid),
        source: name
      };
      return info;
    } catch (error) {
      console.warn(`Não foi possível ler ${name}:`, error?.message ?? error);
    }
  }
  return {};
}

function parseKeyValueConfig(content) {
  const result = {};
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) continue;
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (!key) continue;
    result[key] = value;
  }
  return result;
}
