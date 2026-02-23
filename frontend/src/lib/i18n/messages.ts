import { APP_LOCALES, DEFAULT_LOCALE, type AppLocale } from './config';

type CommonMessages = {
  labels: {
    room: string;
    adminPinShort: string;
    adminPinLong: string;
    status: string;
  };
  errors: Record<string, string>;
  confirmations: {
    regenerateTokens: string;
  };
  srOnly: {
    close: string;
  };
  languageLabel: string;
  languages: Record<AppLocale, string>;
  integration: {
    missingTitle: string;
    invalidSourceTitle: string;
    missingHint: string;
    exampleLabel: string;
  };
};

type DisplayMessages = {
  metaDescription?: string;
  menu: {
    optionsTitle: string;
    quickActionsTitle: string;
    fullscreenEnter: string;
    fullscreenExit: string;
    goToAdmin: string;
    toggleButton: string;
  };
  zoom: {
    label: string;
    reset: string;
  };
  wake: {
    title: string;
    keepAwake: string;
    on: string;
    off: string;
    warning: string;
  };
  status: {
    waiting: string;
  };
  missing: {
    title: string;
    description: string;
    goToAdmin: string;
  };
  interval: {
    primaryLabel: string;
    secondaryLabel: string;
    endMessage: string;
  };
  countdown: {
    primaryLabel: string;
    warningLabel: string;
  };
};

type AdminMessages = {
  metaDescription?: string;
  header: {
    title: string;
    generatingLinks: string;
  };
  integration: {
    title: string;
    description: string;
    openPanel: string;
    authUserLabel: string;
    authPasswordLabel: string;
    authHint: string;
    authSubmit: string;
    urlLabel: string;
    urlPlaceholder: string;
    save: string;
    clear: string;
    goToDisplay: string;
    goToLegend: string;
    goToTimer: string;
    linksDisabled: string;
    activeBadge: string;
    saved: string;
    cleared: string;
    invalidUrl: string;
    missingMeet: string;
    missingRoomId: string;
    missingRoomIdHint: string;
    openWithPinHint: string;
  };
  timer: {
    title: string;
    start: string;
    stop: string;
    resetDefault: string;
    minutesLabel: string;
    set: string;
  };
  interval: {
    title: string;
    configured: string;
    remaining: string;
    hours: string;
    minutes: string;
    seconds: string;
    set: string;
    start: string;
    pause: string;
    reset: string;
    showInterval: string;
    showLights: string;
    note: string;
  };
  preview: {
    waiting: string;
    showQr: string;
    goToDisplay: string;
    goToLegend: string;
    goToTimer: string;
  };
  qrMenu: {
    title: string;
    description: string;
    regenerate: string;
    regenerating: string;
    loading: string;
    ariaLabel: string;
    targets: {
      left: string;
      center: string;
      right: string;
    };
  };
  roomSetup: {
    badge: string;
    title: string;
    description: string;
    create: {
      title: string;
      description: string;
      steps: [string, string];
      cta: string;
      note: string;
    };
    join: {
      title: string;
      description: string;
      roomLabel: string;
      roomPlaceholder: string;
      pinLabel: string;
      pinPlaceholder: string;
      submit: string;
    };
  };
  fullPage: {
    loadingTitle: string;
    loadingDescription: string;
    connectingTitle: string;
    connectingDescription: string;
  };
};

type LegendMessages = {
  metaDescription?: string;
  title: string;
  statusRoomSuffix: string;
  missingCredentials: string;
  errorPrefix: string;
  buttons: {
    paletteOpen: string;
    paletteClose: string;
    placeholdersShow: string;
    placeholdersHide: string;
    frameShow: string;
    frameHide: string;
    digits: string;
    wake: string;
  };
  digitsModes: {
    hhmmss: string;
    mmss: string;
  };
  palette: {
    title: string;
    selectColor: string;
    customColor: string;
    timerColor: string;
    transparentBackground: string;
  };
  share: {
    title: string;
    description: string;
    save: string;
    saved: string;
    copy: string;
    copied: string;
  };
  wakeWarning: string;
  waiting: string;
};

type RefereeMessages = {
  metaDescription?: string;
  selectorTitle: string;
  invalidRoute: string;
  center: {
    title: string;
    timeLabel: string;
    start: string;
    pause: string;
    reset: string;
    valid: string;
  };
  side: {
    leftTitle: string;
    rightTitle: string;
    valid: string;
  };
  missing: {
    title: string;
    description: string;
  };
};

export type Messages = {
  common: CommonMessages;
  display: DisplayMessages;
  admin: AdminMessages;
  legend: LegendMessages;
  referee: RefereeMessages;
};

const MESSAGES: Record<AppLocale, Messages> = {
  'pt-BR': {
    common: {
      labels: {
        room: 'Sala',
        adminPinShort: 'PIN admin',
        adminPinLong: 'PIN Administrativo',
        status: 'Status'
    },
    errors: {
      invalid_pin: 'PIN inválido. Atualize a URL pelo painel admin.',
      room_not_found: 'Sala não encontrada.',
        request_failed: 'Falha ao conectar ao servidor.',
        not_authorised: 'Acesso não autorizado.',
        token_revoked: 'Links antigos foram revogados. Gere novos QR Codes.',
        invalid_token: 'Token expirado ou inválido.',
        invalid_credentials: 'Usuário ou senha inválidos.',
        external_invalid_url: 'URL externa inválida. Use um endereço completo com http:// ou https://.',
        external_missing_meet: 'Informe o código da competição em `meet` ou via `externalMeet`.',
        unknown_error: 'Erro inesperado.',
        invalid_payload: 'Dados inválidos enviados ao servidor.'
      },
      confirmations: {
        regenerateTokens: 'Gerar novos links desconecta árbitros conectados. Deseja continuar?'
      },
    srOnly: {
      close: 'Fechar'
    },
    languageLabel: 'Idioma',
    languages: {
      'pt-BR': 'Português',
      'en-US': 'English',
      'es-ES': 'Español'
    },
    integration: {
      missingTitle: 'Integração não configurada',
      invalidSourceTitle: 'Fonte externa inválida',
      missingHint: 'Abra este link com `externalUrl` ou `meet`.',
      exampleLabel: 'Exemplo'
    }
  },
    display: {
      metaDescription:
        'Display sincronizado para eventos IPF com luzes, cronômetro e alertas de intervalo conectados ao painel Referee Lights.',
      menu: {
        optionsTitle: 'Opções',
        quickActionsTitle: 'Ações rápidas',
        fullscreenEnter: 'Entrar em tela cheia',
        fullscreenExit: 'Sair da tela cheia',
        goToAdmin: 'Ir para Admin',
        toggleButton: 'Alternar menu do display'
      },
      zoom: {
        label: 'Zoom',
        reset: 'Resetar'
      },
      wake: {
        title: 'Tela ativa',
        keepAwake: 'Manter tela ativa',
        on: 'ON',
        off: 'OFF',
        warning: 'Não foi possível ativar o modo sem descanso. Toque na tela ou tente novamente.'
      },
      status: {
        waiting: 'Aguardando conexão...'
      },
      missing: {
        title: 'Display não configurado',
        description: 'Adicione `roomId` e `pin` à URL, por exemplo `/display?roomId=ABCD&pin=1234`, ou abra o painel admin para gerar uma nova sessão.',
        goToAdmin: 'Ir para Admin'
      },
      interval: {
        primaryLabel: 'Próximo Round',
        secondaryLabel: 'Troca das pedidas',
        endMessage: 'TROCA DE PEDIDAS ENCERRADA'
      },
      countdown: {
        primaryLabel: 'Intervalo Programado',
        warningLabel: 'Aviso (-3 min)'
      }
    },
    admin: {
      metaDescription:
        'Controle o fluxo das luzes IPF: crie sessões com PIN, gere QR Codes, ajuste timers e acompanhe árbitros em tempo real.',
      header: {
        title: 'Administração da Plataforma',
        generatingLinks: 'Gerando novos links...'
      },
      integration: {
        title: 'Integrações',
        description: 'Defina a URL externa para alimentar display e legenda. Ao salvar, os botões abaixo abrirão no modo integração.',
        openPanel: 'Integração',
        authUserLabel: 'Usuário',
        authPasswordLabel: 'Senha',
        authHint: 'Use credenciais de integração para salvar ou remover a URL.',
        authSubmit: 'Acessar',
        urlLabel: 'URL externa',
        urlPlaceholder: 'https://easyliftersoftware.com/referee/lights?meet=3NJH7Y53',
        save: 'Salvar integração',
        clear: 'Remover',
        goToDisplay: 'Display integração',
        goToLegend: 'Legenda integração',
        goToTimer: 'Cronômetro integração',
        linksDisabled: 'Salve uma URL externa para habilitar os links de integração.',
        activeBadge: 'Integração ativa',
        saved: 'Integração atualizada.',
        cleared: 'Integração removida.',
        invalidUrl: 'URL inválida. Use um endereço completo com http:// ou https://.',
        missingMeet: 'A URL deve conter o parâmetro `meet`.',
        missingRoomId: 'Informe `roomId` na URL para carregar esta sala.',
        missingRoomIdHint: 'Exemplo: /integration?roomId=ABCD&pin=1234',
        openWithPinHint: 'Abra com `pin` para editar: /integration?roomId={roomId}&pin=1234'
      },
      timer: {
        title: 'Timer',
        start: 'Iniciar',
        stop: 'Parar',
        resetDefault: 'Reset 1:00',
        minutesLabel: 'Minutos',
        set: 'Definir'
      },
      interval: {
        title: 'Intervalo',
        configured: 'Configurado',
        remaining: 'Restante',
        hours: 'Horas',
        minutes: 'Minutos',
        seconds: 'Segundos',
        set: 'Definir',
        start: 'Iniciar intervalo',
        pause: 'Pausar',
        reset: 'Reset intervalo',
        showInterval: 'Mostrar intervalo',
        showLights: 'Mostrar luzes',
        note: 'O display exibirá um aviso em vermelho três minutos antes do término.'
      },
      preview: {
        waiting: 'Aguardando estado...',
        showQr: 'Mostrar QR Codes',
        goToDisplay: 'Ir para Display',
        goToLegend: 'Legenda',
        goToTimer: 'Cronômetro'
      },
      qrMenu: {
        title: 'Compartilhar com árbitros',
        description: 'Escaneie o QR Code correspondente para abrir o console do árbitro em um dispositivo conectado à mesma sessão.',
        regenerate: 'Gerar novos links',
        regenerating: 'Gerando...',
        loading: 'Carregando QR Codes...',
        ariaLabel: 'QR Codes para árbitros',
        targets: {
          left: 'Árbitro Esquerdo',
          center: 'Árbitro Central',
          right: 'Árbitro Direito'
        }
      },
      roomSetup: {
        badge: 'Painel Administrativo',
        title: 'Configurar plataforma',
        description: 'Gerencie as sessões do sistema em um só lugar. Gere novas salas com PIN administrativo e QR Codes exclusivos ou retome o controle de uma sessão existente informando o identificador e o PIN correspondente.',
        create: {
          title: 'Criar nova sessão',
          description: 'Configure uma sala completa em segundos com PIN administrativo, QR Codes para cada árbitro e um link de display pronto para compartilhar.',
          steps: [
            'Compartilhe o PIN com a equipe e distribua automaticamente os QR Codes gerados para cada árbitro.',
            'Inicie a sessão com timers, cartões e votos sincronizados em tempo real a partir deste painel.'
          ],
          cta: 'Gerar sessão agora',
          note: 'Tokens podem ser rotacionados sempre que necessário após a criação da sala.'
        },
        join: {
          title: 'Entrar em sessão existente',
          description: 'Informe os dados da sala para reconectar este painel a uma sessão ativa e continuar a operação sem interrupções.',
          roomLabel: 'Sala',
          roomPlaceholder: 'ABCD',
          pinLabel: 'PIN Administrativo',
          pinPlaceholder: '1234',
          submit: 'Entrar no painel'
        }
      },
      fullPage: {
        loadingTitle: 'Carregando',
        loadingDescription: 'Preparando painel...',
        connectingTitle: 'Conectando',
        connectingDescription: 'Sincronizando dados da plataforma...'
      }
    },
    legend: {
      metaDescription:
        'Painel complementar com timer customizável, modo chroma key e status em tempo real para transmissões IPF.',
      title: 'Legenda',
      statusRoomSuffix: ' - Sala {roomId}',
      missingCredentials: 'Informe `roomId` e `pin` na URL para conectar.',
      errorPrefix: 'Erro:',
      buttons: {
        paletteOpen: 'Cor de Fundo',
        paletteClose: 'Fechar Cor',
        placeholdersShow: 'Mostrar Molduras',
        placeholdersHide: 'Ocultar Molduras',
        frameShow: 'Mostrar Linha',
        frameHide: 'Ocultar Linha',
        digits: 'Dígitos: {mode}',
        wake: 'Tela ativa: {state}'
      },
      digitsModes: {
        hhmmss: 'HH:MM:SS',
        mmss: 'MM:SS'
      },
      palette: {
        title: 'Paleta rápida',
        selectColor: 'Selecionar {color}',
        customColor: 'Cor custom',
        timerColor: 'Cronômetro',
        transparentBackground: 'Fundo transparente'
      },
      share: {
        title: 'Link de compartilhamento',
        description: 'Abra este link para exibir apenas a legenda, sem os controles de configuração.',
        save: 'Salvar',
        saved: 'Salvo',
        copy: 'Copiar link',
        copied: 'Copiado'
      },
      wakeWarning: 'Não foi possível ativar o modo sem descanso. Toque na tela ou tente novamente.',
      waiting: 'Aguardando conexão...'
    },
    referee: {
      metaDescription:
        'Console móvel do árbitro com botões GOOD/NO LIFT, cartões IPF e sincronização em tempo real com o painel Referee Lights.',
      selectorTitle: 'Selecione a posição do árbitro',
      invalidRoute: 'Rota de árbitro inválida.',
      center: {
        title: 'Árbitro Central',
        timeLabel: 'Tempo oficial',
        start: 'Iniciar',
        pause: 'Pausar',
        reset: 'Resetar',
        valid: 'GOOD LIFT'
      },
      side: {
        leftTitle: 'Árbitro Lateral Esquerdo',
        rightTitle: 'Árbitro Lateral Direito',
        valid: 'GOOD LIFT'
      },
      missing: {
        title: 'Console indisponível',
        description: 'Utilize um QR Code atualizado para acessar `{judge}` com sala e token válidos.'
      }
    }
  },
  'en-US': {
    common: {
      labels: {
        room: 'Room',
        adminPinShort: 'Admin PIN',
        adminPinLong: 'Admin PIN',
        status: 'Status'
      },
      errors: {
        invalid_pin: 'Invalid PIN. Refresh the URL from the admin panel.',
        room_not_found: 'Room not found.',
        request_failed: 'Failed to connect to the server.',
        not_authorised: 'Unauthorized access.',
        token_revoked: 'Links have been revoked. Generate new QR Codes.',
        invalid_token: 'Token expired or invalid.',
        invalid_credentials: 'Invalid username or password.',
        external_invalid_url: 'Invalid external URL. Use a full address with http:// or https://.',
        external_missing_meet: 'Provide the competition code using `meet` or `externalMeet`.',
        unknown_error: 'Unexpected error.',
        invalid_payload: 'Invalid data sent to the server.'
      },
      confirmations: {
        regenerateTokens: 'Generating new links will disconnect connected referees. Continue?'
      },
    srOnly: {
      close: 'Close'
    },
    languageLabel: 'Language',
    languages: {
      'pt-BR': 'Português',
      'en-US': 'English',
      'es-ES': 'Español'
    },
    integration: {
      missingTitle: 'Integration not configured',
      invalidSourceTitle: 'Invalid external source',
      missingHint: 'Open this link with `externalUrl` or `meet`.',
      exampleLabel: 'Example'
    }
  },
    display: {
      metaDescription:
        'Synchronized IPF display with live lights, timers, and interval alerts managed from the Referee Lights admin panel.',
      menu: {
        optionsTitle: 'Options',
        quickActionsTitle: 'Quick actions',
        fullscreenEnter: 'Enter fullscreen',
        fullscreenExit: 'Exit fullscreen',
        goToAdmin: 'Go to Admin',
        toggleButton: 'Toggle display menu'
      },
      zoom: {
        label: 'Zoom',
        reset: 'Reset'
      },
      wake: {
        title: 'Screen awake',
        keepAwake: 'Keep screen awake',
        on: 'ON',
        off: 'OFF',
        warning: 'Could not enable keep-awake mode. Tap the screen or try again.'
      },
      status: {
        waiting: 'Waiting for connection...'
      },
      missing: {
        title: 'Display not configured',
        description: 'Add `roomId` and `pin` to the URL, for example `/display?roomId=ABCD&pin=1234`, or open the admin panel to generate a new session.',
        goToAdmin: 'Go to Admin'
      },
      interval: {
        primaryLabel: 'Flight begins',
        secondaryLabel: 'Change openers',
        endMessage: 'OPENER CHANGES CLOSED'
      },
      countdown: {
        primaryLabel: 'Scheduled interval',
        warningLabel: 'Warning (-3 min)'
      }
    },
    admin: {
      metaDescription:
        'Control the IPF referee light setup: create sessions, rotate QR codes, tweak timers, and monitor judges in real time.',
      header: {
        title: 'Platform Admin',
        generatingLinks: 'Generating new links...'
      },
      integration: {
        title: 'Integrations',
        description: 'Set an external URL to feed display and legend. After saving, the buttons below will open in integration mode.',
        openPanel: 'Integration',
        authUserLabel: 'Username',
        authPasswordLabel: 'Password',
        authHint: 'Use integration credentials to save or remove the URL.',
        authSubmit: 'Access',
        urlLabel: 'External URL',
        urlPlaceholder: 'https://easyliftersoftware.com/referee/lights?meet=3NJH7Y53',
        save: 'Save integration',
        clear: 'Remove',
        goToDisplay: 'Integration display',
        goToLegend: 'Integration legend',
        goToTimer: 'Integration timer',
        linksDisabled: 'Save an external URL to enable integration links.',
        activeBadge: 'Integration active',
        saved: 'Integration updated.',
        cleared: 'Integration removed.',
        invalidUrl: 'Invalid URL. Use a full address with http:// or https://.',
        missingMeet: 'The URL must include the `meet` parameter.',
        missingRoomId: 'Provide `roomId` in the URL to load this room.',
        missingRoomIdHint: 'Example: /integration?roomId=ABCD&pin=1234',
        openWithPinHint: 'Open with `pin` to edit: /integration?roomId={roomId}&pin=1234'
      },
      timer: {
        title: 'Timer',
        start: 'Start',
        stop: 'Stop',
        resetDefault: 'Reset 1:00',
        minutesLabel: 'Minutes',
        set: 'Set'
      },
      interval: {
        title: 'Interval',
        configured: 'Configured',
        remaining: 'Remaining',
        hours: 'Hours',
        minutes: 'Minutes',
        seconds: 'Seconds',
        set: 'Set',
        start: 'Start interval',
        pause: 'Pause',
        reset: 'Reset interval',
        showInterval: 'Show interval',
        showLights: 'Show lights',
        note: 'The display will show a red warning three minutes before the end.'
      },
      preview: {
        waiting: 'Waiting for state...',
        showQr: 'Show QR Codes',
        goToDisplay: 'Open Display',
        goToLegend: 'Open Legend',
        goToTimer: 'Open Timer'
      },
      qrMenu: {
        title: 'Share with referees',
        description: 'Scan the matching QR Code to open the referee console on a device connected to this session.',
        regenerate: 'Generate new links',
        regenerating: 'Generating...',
        loading: 'Loading QR Codes...',
        ariaLabel: 'QR Codes for referees',
        targets: {
          left: 'Left Referee',
          center: 'Center Referee',
          right: 'Right Referee'
        }
      },
      roomSetup: {
        badge: 'Admin Panel',
        title: 'Configure platform',
        description: 'Manage the system sessions in one place. Create new rooms with an admin PIN and dedicated QR Codes, or regain control of an existing session by entering its identifier and PIN.',
        create: {
          title: 'Create new session',
          description: 'Set up a complete room in seconds with an admin PIN, QR Codes for each referee, and a display link ready to share.',
          steps: [
            'Share the PIN with the team and automatically distribute the generated QR Codes to each referee.',
            'Start the session with timers, cards, and votes synchronized in real time from this panel.'
          ],
          cta: 'Create session now',
          note: 'Tokens can be rotated whenever necessary after the room is created.'
        },
        join: {
          title: 'Join existing session',
          description: 'Enter the session details to reconnect this panel to an active session and continue operating without interruptions.',
          roomLabel: 'Room',
          roomPlaceholder: 'ABCD',
          pinLabel: 'Admin PIN',
          pinPlaceholder: '1234',
          submit: 'Enter the panel'
        }
      },
      fullPage: {
        loadingTitle: 'Loading',
        loadingDescription: 'Preparing panel...',
        connectingTitle: 'Connecting',
        connectingDescription: 'Syncing platform data...'
      }
    },
    legend: {
      metaDescription:
        'Companion screen with customizable timer, chroma key background, and real-time status for IPF broadcasts.',
      title: 'Legend',
      statusRoomSuffix: ' - Room {roomId}',
      missingCredentials: 'Add `roomId` and `pin` to the URL to connect.',
      errorPrefix: 'Error:',
      buttons: {
        paletteOpen: 'Background color',
        paletteClose: 'Close color',
        placeholdersShow: 'Show frames',
        placeholdersHide: 'Hide frames',
        frameShow: 'Show dashed line',
        frameHide: 'Hide dashed line',
        digits: 'Digits: {mode}',
        wake: 'Screen awake: {state}'
      },
      digitsModes: {
        hhmmss: 'HH:MM:SS',
        mmss: 'MM:SS'
      },
      palette: {
        title: 'Quick palette',
        selectColor: 'Select {color}',
        customColor: 'Custom color',
        timerColor: 'Timer',
        transparentBackground: 'Transparent background'
      },
      share: {
        title: 'Share link',
        description: 'Open this link to display only the legend, without configuration controls.',
        save: 'Save',
        saved: 'Saved',
        copy: 'Copy link',
        copied: 'Copied'
      },
      wakeWarning: 'Could not enable keep-awake mode. Tap the screen or try again.',
      waiting: 'Waiting for connection...'
    },
    referee: {
      metaDescription:
        'Mobile referee console with GOOD/NO LIFT controls, IPF cards, and real-time sync with the Referee Lights platform.',
      selectorTitle: 'Select referee position',
      invalidRoute: 'Invalid referee route.',
      center: {
        title: 'Center Referee',
        timeLabel: 'Official time',
        start: 'Start',
        pause: 'Pause',
        reset: 'Reset',
        valid: 'GOOD LIFT'
      },
      side: {
        leftTitle: 'Left Side Referee',
        rightTitle: 'Right Side Referee',
        valid: 'GOOD LIFT'
      },
      missing: {
        title: 'Console unavailable',
        description: 'Use an updated QR Code to access `{judge}` with a valid room and token.'
      }
    }
  },
  'es-ES': {
    common: {
      labels: {
        room: 'Sala',
        adminPinShort: 'PIN admin',
        adminPinLong: 'PIN administrativo',
        status: 'Estado'
      },
      errors: {
        invalid_pin: 'PIN inválido. Actualiza la URL desde el panel de administración.',
        room_not_found: 'Sala no encontrada.',
        request_failed: 'No se pudo conectar con el servidor.',
        not_authorised: 'Acceso no autorizado.',
        token_revoked: 'Los enlaces anteriores fueron revocados. Genera nuevos códigos QR.',
        invalid_token: 'Token expirado o inválido.',
        invalid_credentials: 'Usuario o contraseña inválidos.',
        external_invalid_url: 'URL externa inválida. Usa una dirección completa con http:// o https://.',
        external_missing_meet: 'Informa el código de la competición usando `meet` o `externalMeet`.',
        unknown_error: 'Error inesperado.',
        invalid_payload: 'Datos inválidos enviados al servidor.'
      },
      confirmations: {
        regenerateTokens: 'Generar nuevos enlaces desconectará a los árbitros conectados. ¿Deseas continuar?'
      },
    srOnly: {
      close: 'Cerrar'
    },
    languageLabel: 'Idioma',
    languages: {
      'pt-BR': 'Portugués',
      'en-US': 'Inglés',
      'es-ES': 'Español'
    },
    integration: {
      missingTitle: 'Integración no configurada',
      invalidSourceTitle: 'Fuente externa inválida',
      missingHint: 'Abre este enlace con `externalUrl` o `meet`.',
      exampleLabel: 'Ejemplo'
    }
  },
    display: {
      metaDescription:
        'Pantalla IPF sincronizada con luces, cronómetro y avisos de intervalo controlados desde el panel Referee Lights.',
      menu: {
        optionsTitle: 'Opciones',
        quickActionsTitle: 'Acciones rápidas',
        fullscreenEnter: 'Entrar en pantalla completa',
        fullscreenExit: 'Salir de pantalla completa',
        goToAdmin: 'Ir al panel',
        toggleButton: 'Abrir menú del display'
      },
      zoom: {
        label: 'Zoom',
        reset: 'Reiniciar'
      },
      wake: {
        title: 'Pantalla activa',
        keepAwake: 'Mantener pantalla activa',
        on: 'ON',
        off: 'OFF',
        warning: 'No se pudo activar el modo de mantener despierto. Toca la pantalla o inténtalo de nuevo.'
      },
      status: {
        waiting: 'Esperando la conexión...'
      },
      missing: {
        title: 'Pantalla no configurada',
        description: 'Agrega `roomId` y `pin` a la URL, por ejemplo `/display?roomId=ABCD&pin=1234`, o abre el panel de administración para generar una nueva sesión.',
        goToAdmin: 'Ir al panel'
      },
      interval: {
        primaryLabel: 'Inicio del flight',
        secondaryLabel: 'Cambiar aperturas',
        endMessage: 'CAMBIOS CERRADOS'
      },
      countdown: {
        primaryLabel: 'Intervalo programado',
        warningLabel: 'Aviso (-3 min)'
      }
    },
    admin: {
      metaDescription:
        'Administra las luces IPF: crea sesiones con PIN, genera códigos QR, ajusta temporizadores y monitorea a los árbitros en tiempo real.',
      header: {
        title: 'Administración de la plataforma',
        generatingLinks: 'Generando nuevos enlaces...'
      },
      integration: {
        title: 'Integraciones',
        description: 'Define una URL externa para alimentar display y leyenda. Al guardar, los botones de abajo abrirán en modo integración.',
        openPanel: 'Integración',
        authUserLabel: 'Usuario',
        authPasswordLabel: 'Contraseña',
        authHint: 'Usa credenciales de integración para guardar o eliminar la URL.',
        authSubmit: 'Acceder',
        urlLabel: 'URL externa',
        urlPlaceholder: 'https://easyliftersoftware.com/referee/lights?meet=3NJH7Y53',
        save: 'Guardar integración',
        clear: 'Quitar',
        goToDisplay: 'Display integración',
        goToLegend: 'Leyenda integración',
        goToTimer: 'Cronómetro integración',
        linksDisabled: 'Guarda una URL externa para habilitar los enlaces de integración.',
        activeBadge: 'Integración activa',
        saved: 'Integración actualizada.',
        cleared: 'Integración eliminada.',
        invalidUrl: 'URL inválida. Usa una dirección completa con http:// o https://.',
        missingMeet: 'La URL debe incluir el parámetro `meet`.',
        missingRoomId: 'Informa `roomId` en la URL para cargar esta sala.',
        missingRoomIdHint: 'Ejemplo: /integration?roomId=ABCD&pin=1234',
        openWithPinHint: 'Abre con `pin` para editar: /integration?roomId={roomId}&pin=1234'
      },
      timer: {
        title: 'Temporizador',
        start: 'Iniciar',
        stop: 'Detener',
        resetDefault: 'Reiniciar 1:00',
        minutesLabel: 'Minutos',
        set: 'Fijar'
      },
      interval: {
        title: 'Intervalo',
        configured: 'Configurado',
        remaining: 'Restante',
        hours: 'Horas',
        minutes: 'Minutos',
        seconds: 'Segundos',
        set: 'Fijar',
        start: 'Iniciar intervalo',
        pause: 'Pausar',
        reset: 'Reiniciar intervalo',
        showInterval: 'Mostrar intervalo',
        showLights: 'Mostrar luces',
        note: 'La pantalla mostrará una alerta roja tres minutos antes del final.'
      },
      preview: {
        waiting: 'Esperando estado...',
        showQr: 'Mostrar códigos QR',
        goToDisplay: 'Abrir display',
        goToLegend: 'Abrir leyenda',
        goToTimer: 'Abrir cronómetro'
      },
      qrMenu: {
        title: 'Compartir con árbitros',
        description: 'Escanea el código QR correspondiente para abrir la consola del árbitro en un dispositivo conectado a esta sesión.',
        regenerate: 'Generar nuevos enlaces',
        regenerating: 'Generando...',
        loading: 'Cargando códigos QR...',
        ariaLabel: 'Códigos QR para árbitros',
        targets: {
          left: 'Árbitro izquierdo',
          center: 'Árbitro central',
          right: 'Árbitro derecho'
        }
      },
      roomSetup: {
        badge: 'Panel administrativo',
        title: 'Configurar plataforma',
        description: 'Gestiona las sesiones del sistema en un solo lugar. Crea nuevas salas con PIN administrativo y códigos QR exclusivos, o recupera una sesión existente introduciendo su identificador y PIN correspondiente.',
        create: {
          title: 'Crear nueva sesión',
          description: 'Configura una sala completa en segundos con PIN administrativo, códigos QR para cada árbitro y un enlace de display listo para compartir.',
          steps: [
            'Comparte el PIN con el equipo y distribuye automáticamente los códigos QR generados para cada árbitro.',
            'Inicia la sesión con temporizadores, tarjetas y votos sincronizados en tiempo real desde este panel.'
          ],
          cta: 'Generar sesión ahora',
          note: 'Los tokens pueden rotarse cuando sea necesario después de crear la sala.'
        },
        join: {
          title: 'Ingresar a sesión existente',
          description: 'Introduce los datos de la sala para reconectar este panel a una sesión activa y continuar la operación sin interrupciones.',
          roomLabel: 'Sala',
          roomPlaceholder: 'ABCD',
          pinLabel: 'PIN administrativo',
          pinPlaceholder: '1234',
          submit: 'Entrar al panel'
        }
      },
      fullPage: {
        loadingTitle: 'Cargando',
        loadingDescription: 'Preparando panel...',
        connectingTitle: 'Conectando',
        connectingDescription: 'Sincronizando datos de la plataforma...'
      }
    },
    legend: {
      metaDescription:
        'Pantalla complementaria con temporizador personalizable, fondo chroma key y estado en tiempo real para transmisiones IPF.',
      title: 'Leyenda',
      statusRoomSuffix: ' - Sala {roomId}',
      missingCredentials: 'Agrega `roomId` y `pin` a la URL para conectar.',
      errorPrefix: 'Error:',
      buttons: {
        paletteOpen: 'Color de fondo',
        paletteClose: 'Cerrar color',
        placeholdersShow: 'Mostrar marcos',
        placeholdersHide: 'Ocultar marcos',
        frameShow: 'Mostrar línea',
        frameHide: 'Ocultar línea',
        digits: 'Dígitos: {mode}',
        wake: 'Pantalla activa: {state}'
      },
      digitsModes: {
        hhmmss: 'HH:MM:SS',
        mmss: 'MM:SS'
      },
      palette: {
        title: 'Paleta rápida',
        selectColor: 'Seleccionar {color}',
        customColor: 'Color personalizado',
        timerColor: 'Cronómetro',
        transparentBackground: 'Fondo transparente'
      },
      share: {
        title: 'Enlace para compartir',
        description: 'Abre este enlace para mostrar solo la leyenda, sin controles de configuración.',
        save: 'Guardar',
        saved: 'Guardado',
        copy: 'Copiar enlace',
        copied: 'Copiado'
      },
      wakeWarning: 'No se pudo activar el modo de mantener despierto. Toca la pantalla o inténtalo de nuevo.',
      waiting: 'Esperando la conexión...'
    },
    referee: {
      metaDescription:
        'Consola móvil para árbitros con botones GOOD/NO LIFT, tarjetas IPF y sincronización en tiempo real con el panel Referee Lights.',
      selectorTitle: 'Selecciona la posición del árbitro',
      invalidRoute: 'Ruta de árbitro inválida.',
      center: {
        title: 'Árbitro central',
        timeLabel: 'Tiempo oficial',
        start: 'Iniciar',
        pause: 'Pausar',
        reset: 'Reiniciar',
        valid: 'GOOD LIFT'
      },
      side: {
        leftTitle: 'Árbitro lateral izquierdo',
        rightTitle: 'Árbitro lateral derecho',
        valid: 'GOOD LIFT'
      },
      missing: {
        title: 'Consola no disponible',
        description: 'Usa un código QR actualizado para acceder a `{judge}` con una sala y token válidos.'
      }
    }
  }
};

export function getMessages(locale: string | undefined): Messages {
  if (locale && APP_LOCALES.includes(locale as AppLocale)) {
    return MESSAGES[locale as AppLocale];
  }
  return MESSAGES[DEFAULT_LOCALE];
}
