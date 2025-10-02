# Referee Lights · Frontend

Next.js + TypeScript servindo quatro telas simples:

- `/` – display full screen (fundo preto)
- `/admin` – painel de controle geral com preview das luzes/cronômetro
- `/ref/left`, `/ref/right` – consoles laterais
- `/ref/center` – console do árbitro central (inclui botões do timer)

Todas se conectam ao Socket.IO do backend e compartilham o estado global.

## Rodando
```bash
npm install
cp .env.example .env.local
npm run dev
```

### Recursos recentes
- Preview administrativo ajustável via `previewLayout` em `src/pages/admin.tsx` (escala, deslocamento e espaçamento).
- Alertas sonoros do intervalo e cronômetro principal controlados em `src/components/IntervalFull.tsx` (beeps nos últimos 10 s e avisos finais).
- Mensagem automática `TROCA DE PEDIDAS ENCERRADA` exibida após o fim do tempo de troca.

### Variável obrigatória
- `NEXT_PUBLIC_WS_URL` – URL do Socket.IO (ex.: `http://localhost:3333`)

## Build/Deploy
- `npm run build` → `npm run start`
- Para Vercel: defina `NEXT_PUBLIC_WS_URL` apontando para o backend público.
