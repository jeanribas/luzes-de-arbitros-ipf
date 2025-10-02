# Guia de Operação – Luzes de Árbitros

## 1. Preparação

1. Abra o dashboard em `https://app.seu-dominio/admin`.
2. Clique em “Create new room” para gerar uma plataforma.
3. Anote o `Room code` (ex.: `PLAT1`) e o PIN de admin.
4. No painel, compartilhe os QR codes com os árbitros (um por posição). Cada QR expira em 15 minutos – clique em “Refresh tokens” caso precise renovar.

## 2. Configurar Display

1. Acesse `https://app.seu-dominio/?roomId=PLAT1&pin=XXXX` na TV/monitor.
2. Opcional: coloque em tela cheia (`F` ou botão “Toggle Fullscreen”).
3. Ajuste os toggles (timer, logo, QR codes, fullscreen hint) conforme necessário.

## 3. Onboarding dos Árbitros

1. Cada árbitro escaneia o QR correspondente com o celular.
2. A console móvel mostra dois botões grandes: “GOOD LIFT” (branco) e “NO LIFT” (vermelho).
3. Ao tocar “NO LIFT”, o árbitro escolhe opcionalmente o cartão IPF (1/2/3) para o motivo.

## 4. Fluxo do Levantamento

1. Operador (admin/chief) pressiona **Ready** quando o atleta está autorizado.
2. Árbitros aguardam a sinalização de comando e votam (`READY`/`ARMED`).
3. Operador pressiona **Release** (ou aguarda auto-release se habilitado) para abrir as luzes simultaneamente.
4. Árbitros podem atribuir cartões após “NO LIFT”.
5. Quando finalizado, operador pressiona **Clear**, o timer reseta e a fase volta para `IDLE`.

## 5. Timer Oficial

- Start/Stop/Reset diretamente pelo admin.
- Campo “minutes” define rapidamente um novo tempo (ex.: 2 minutos).
- O display pode ocultar o timer via toggle “Show timer”.

## 6. Override do Júri

- Se o júri determinar mudança, use os botões “Mark Good Lift” / “Mark No Lift”.
- Todos os sockets recebem o evento `jury:override` e a decisão é atualizada.

## 7. Boas práticas

- Mantenha os árbitros conectados à mesma rede dedicada.
- Atualize QR tokens se o placar ficar ocioso por mais de 15 minutos.
- Monitore `/metrics` para acompanhar conexões e latência.
- Faça backup do PIN de admin e não compartilhe fora da equipe de plataforma.

> **Modo demo**: para apresentações sem autenticação, habilite `DEMO_MODE=true` no backend e `NEXT_PUBLIC_DEMO_MODE=true` no frontend. A sala padrão (`DEMO_ROOM_ID`) é criada automaticamente e todos os consoles entram sem PIN/token.
