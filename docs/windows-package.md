# Empacotando para Windows (bundle portátil)

Este repositório inclui um script que monta um pacote "portable" contendo:

- Node.js (fornecido pelo usuário);
- build de produção do backend Fastify;
- build de produção do frontend Next.js;
- scripts `start.bat` / `start.sh` para iniciar ambos os serviços.

## Pré-requisitos

- **Node.js 18+** instalado na máquina onde o pacote será gerado (Next.js exige >= 18.17). Se estiver usando Windows apenas para empacotar, instale o "Current" diretamente do site do Node ou use a versão portable.
- `npm` disponível no PATH.
- (Opcional) `zip` caso queira compactar o resultado ao final.

## Como gerar o pacote

```bash
# Na raiz do projeto
node tools/windows/build-package.mjs
```

O script executa:

1. `npm install && npm run build` em `server/` e `frontend/`;
2. Copia os artefatos para `dist/windows-bundle`;
3. Executa `npm ci --omit=dev` dentro dos diretórios copiados;
4. Cria scripts `start.bat`/`start.sh` e um README com instruções.

> Obs.: o processo pode levar alguns minutos, principalmente durante o `npm ci` (instalação apenas de dependências de produção) em cada subprojeto.

## Preparando o pacote para entrega

1. Baixe o Node.js Windows ZIP (x64) em <https://nodejs.org/en/download/prebuilt-installer>.
2. Extraia o conteúdo do ZIP para `dist/windows-bundle/node/` (o arquivo `node.exe` deve ficar diretamente dentro da pasta `node`).
3. Copie/renomeie os arquivos de configuração:
   - `server/.env.example` → `server/.env` (ajuste as variáveis conforme necessário).
   - `frontend/.env.example` → `frontend/.env.local` (pode ficar vazio para os valores padrão).
4. (Opcional) compacte a pasta `dist/windows-bundle` em um `.zip` para distribuir.

## Como usar no Windows final

1. Extraia o pacote para uma pasta (ex.: `C:\luzes-arbitros`).
2. Certifique-se de que `server/.env` e `frontend/.env.local` existam (mesmo que vazios).
3. Dê dois cliques em `start.bat`.
   - Uma janela "Luzes Arbitros Server" e outra "Luzes Arbitros Frontend" abrirão.
   - Acesse pelo IP local da máquina (ex.: `http://192.168.x.x:3000`).
4. Para encerrar, feche as janelas de console ou pressione `Ctrl+C` em cada uma.

## Personalizações

- Se quiser configurar scripts adicionais (por exemplo, `stop.bat`), basta editar `tools/windows/build-package.mjs` ou adicionar arquivos em `dist/windows-bundle` após a geração.
- Caso o pacote vá rodar em portas diferentes, ajuste `frontend/.env.local` (`NEXT_PUBLIC_WS_URL`) e `server/.env` (`PORT`) antes de rodar `start.bat`.

## Solução alternativa (sem script)

Se preferir montar manualmente:

1. Rode `npm run build` em `server` e `frontend`.
2. Copie `server/dist`, `server/package.json`, `server/package-lock.json` e `server/.env.example` para a pasta de destino.
3. Rode `npm ci --omit=dev` nessa pasta.
4. Copie `frontend/.next`, `frontend/public`, `frontend/package.json`, `frontend/package-lock.json`, `frontend/.env.example`, `frontend/next.config.js` e execute `npm ci --omit=dev`.
5. Crie scripts equivalentes aos fornecidos pelo build.

Recomenda-se usar o script automático para evitar erros manuais.
