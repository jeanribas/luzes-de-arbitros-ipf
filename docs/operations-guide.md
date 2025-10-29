# Guia de Operação – Luzes de Árbitros

## 1. Preparação

1. Abra o painel em `https://app.seu-dominio/admin`.
2. Clique em **Criar nova sessão** para gerar a plataforma.
3. Anote o `roomId` (ex.: `PLAT1`) e o PIN administrativo.
4. Use o botão **Mostrar QR Codes** para exibir os links individuais dos árbitros. Caso precise revogar acessos, clique em **Gerar novos links** no modal e confirme a ação.

## 2. Configurar Display

1. Acesse `https://app.seu-dominio/display?roomId=PLAT1&pin=XXXX` na TV/monitor.
2. Opcional: coloque em tela cheia (`F` ou botão “Toggle Fullscreen”).
3. Ajuste o zoom pelo menu flutuante (botão hambúrguer no canto inferior esquerdo). O timer aparece 15% maior por padrão na versão 1.1.

## 3. Onboarding dos Árbitros

1. Cada árbitro escaneia o QR correspondente com o celular.
2. O console móvel exibe os botões “GOOD LIFT” (branco) e “NO LIFT” (vermelho).
3. Ao tocar “NO LIFT”, o árbitro seleciona opcionalmente o cartão IPF (1/2/3) para o motivo.

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

- Se o júri determinar mudança, o operador usa **Mark Good Lift** / **Mark No Lift**.
- Todos os clientes conectados recebem o evento `jury:override` e a decisão é atualizada.

## 7. Boas práticas

- Mantenha os árbitros conectados à mesma rede dedicada.
- Atualize QR tokens se o placar ficar ocioso por mais de 15 minutos.
- Monitore `/metrics` para acompanhar conexões e latência.
- Faça backup do PIN de admin e não compartilhe fora da equipe de plataforma.

> **Modo demo**: para apresentações sem autenticação, habilite `DEMO_MODE=true` no backend e `NEXT_PUBLIC_DEMO_MODE=true` no frontend. A sala padrão (`DEMO_ROOM_ID`) é criada automaticamente e todos os consoles entram sem PIN/token.
