# Referee Lights – Simple Stack

Sistema minimalista de luzes IPF para treinos e demonstrações. Existem quatro interfaces web que compartilham o mesmo estado via WebSocket:

- `/` – Display em tela cheia (fundo preto) com três luzes e timer
- `/admin` – Painel de operação (Ready, Release, Clear) com preview das luzes e cronômetro alinhados à tela principal
- `/ref/left`, `/ref/right` – Consoles individuais
- `/ref/center` – Console do árbitro central (inclui controle do timer)

Não há autenticação, salas nem QR codes: tudo fala diretamente com o servidor usando uma única sala global.

## Executando localmente

### 1. Server (Fastify + Socket.IO)
```bash
cd server
cp .env.example .env
npm install
npm run dev
```
O servidor sobe em `http://localhost:3333`.

### 2. Frontend (Next.js)
```bash
cd ../frontend
cp .env.example .env.local
npm install
npm run dev
```
Aponte o navegador para `http://localhost:3000` nas rotas desejadas.

## Controles do painel `/admin`

- **Ready** – reseta os votos e coloca o sistema em modo de votação
- **Release** – revela as três luzes simultaneamente e dispara o timer de 60 s
- **Clear** – volta para `IDLE` e zera o timer
- **Timer** – botões Start/Stop/Reset e campo para definir um novo tempo (em minutos)
- **Intervalo** – define o tempo programado, exibe o contador de troca (−3 min) e permite alternar entre intervalo e luzes

### Alertas visuais e sonoros
- O contador do intervalo emite toques curtos nos últimos 10 s e um sinal longo quando o tempo de troca atinge zero. Após 1 s, a mensagem `TROCA DE PEDIDAS ENCERRADA` substitui o display vermelho.
- O cronômetro principal também sinaliza os últimos 10 s com bipes curtos e dispara três beeps rápidos no segundo final.
- Por regras dos navegadores, os sons só tocam depois que o operador interage com a página (clique/tecla).

## Fluxo sugerido
1. Abra a tela `/` em modo full screen.
2. Operador acessa `/admin` em notebook/celular.
3. Cada árbitro abre sua respectiva rota `/ref/<lado>`.
4. Ciclo típico: árbitros votam (as luzes aparecem imediatamente). Quando os três votos chegam, ficam na tela por 10 segundos e o sistema se reseta sozinho. O árbitro central pode iniciar/parar/ajustar o cronômetro na própria tela; use os botões do painel apenas se quiser forçar um reset geral.

## Personalização rápida
- Ajuste o tempo padrão editando `INITIAL_TIMER` em `server/src/state.ts`.
- Para adicionar cartões/cores diferentes, altere `DecisionLights` em `frontend/src/components/DecisionLights.tsx`.
- Ajuste o espaçamento e escala do preview administrativo em `previewLayout` (`frontend/src/pages/admin.tsx`).
- Modifique frequências e durações dos alertas sonoros em `frontend/src/components/IntervalFull.tsx`.

## Deploy
- **Server**: qualquer ambiente Node 18+ (ex.: EasyPanel). Basta `npm run build` e `npm start`.
- **Frontend**: Vercel ou semelhante. Configure `NEXT_PUBLIC_WS_URL` apontando para o domínio do servidor.
  Se quiser forçar os QR Codes a usarem um domínio fixo, defina também `NEXT_PUBLIC_QR_ORIGIN` (ex.: `luzes-ipf.assist.com.br`).
- **Pacote Windows**: há um script que gera um bundle portátil (backend + frontend + scripts) em `dist/windows-bundle`. Veja [docs/windows-package.md](docs/windows-package.md).
