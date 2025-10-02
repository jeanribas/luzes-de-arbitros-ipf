# Referee Lights · Server

Pequeno backend Fastify + Socket.IO que mantém o estado global das luzes IPF.

## Scripts

```bash
npm install
npm run dev     # desenvolvimento
npm run build
npm start       # usa dist/index.js
```

### Variáveis de ambiente (`.env`)

- `PORT` (default `3333`)
- `CORS_ORIGIN` – origens autorizadas para o Socket.IO (ex.: `http://localhost:3000`)
- `LOG_LEVEL` – nível de log do Fastify (`info`, `debug`, etc.)

## Evento Socket.IO

Todas as conexões compartilham o mesmo estado. Eventos disponíveis:

- `client:register` `{ role: 'admin'|'display'|'left'|'center'|'right' }`
- `ref:vote` `{ vote: 'white'|'red'|null }`
- `ref:card` `{ card: 1|2|3|null }`
- `admin:ready` (limpa votos/timer)
- `admin:release` (força exibição imediata)
- `admin:clear` (limpa manualmente)
- `timer:command` `{ action: 'start'|'stop'|'reset'|'set', seconds? }` (aceito para `admin` e árbitro `center`)

Assim que os três votos chegam, o servidor mantém o resultado exibido por 10 segundos e limpa automaticamente. O evento `state:update` é emitido a cada mudança (inclusive a contagem do cronômetro).
