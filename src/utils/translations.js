export const translations = {
  de: {
    // App
    app: {
      title: 'Play2 Tournament',
      loading: 'Lade...',
      noEventsSelected: 'Wählen Sie ein Event aus oder erstellen Sie ein neues',
      error: 'Ein Fehler ist aufgetreten'
    },
    
    // Navigation
    navigation: {
      home: 'Startseite',
      events: 'Events',
      players: 'Spieler',
      settings: 'Einstellungen',
      logout: 'Abmelden',
      edit: 'Bearbeiten',
      delete: 'Löschen',
      close: 'Schließen',
      save: 'Speichern',
      cancel: 'Abbrechen',
      back: 'Zurück',
      next: 'Weiter',
      finish: 'Fertig'
    },
    
    // Auth
    auth: {
      login: 'Anmelden',
      signup: 'Registrieren',
      email: 'E-Mail',
      password: 'Passwort',
      confirmPassword: 'Passwort bestätigen',
      forgotPassword: 'Passwort vergessen?',
      loginButton: 'Anmelden',
      signupButton: 'Registrieren',
      roleSelection: 'Ich bin...',
      player: 'Spieler',
      tournamentDirector: 'Turnierdirektor',
      noAccount: 'Noch kein Konto?',
      alreadyHaveAccount: 'Bereits registriert?',
      createAccount: 'Konto erstellen',
      checkEmail: 'Bitte prüfen Sie Ihre E-Mails zur Bestätigung',
      loginSuccess: 'Erfolgreich angemeldet',
      loading: 'Lade...'
    },
    
    // User Menu
    userMenu: {
      profile: 'Profil',
      settings: 'Einstellungen',
      logout: 'Abmelden',
      tournamentDirector: 'Turnierdirektor',
      player: 'Spieler'
    },
    
    // Event
    event: {
      new: 'Neues Event',
      edit: 'Event bearbeiten',
      title: 'Titel',
      description: 'Beschreibung',
      date: 'Datum',
      time: 'Zeit',
      startTime: 'Startzeit',
      endTime: 'Endzeit',
      location: 'Ort',
      sport: 'Sportart',
      format: {
        title: 'Format',
        single: 'Einzel',
        double: 'Doppel'
      },
      courts: 'Plätze',
      maxPlayers: 'Max. Spieler',
      participationFee: 'Teilnahmegebühr',
      status: {
        upcoming: 'Anstehend',
        scheduled: 'Geplant',
        draft: 'Entwurf',
        running: 'Läuft',
        completed: 'Abgeschlossen',
        cancelled: 'Abgesagt',
        0: 'Anstehend',
        1: 'Geplant',
        2: 'Entwurf',
        3: 'Läuft',
        4: 'Abgeschlossen',
        5: 'Abgesagt',
        6: 'Pausiert',
        7: 'Verschoben',
        8: 'Warteliste',
        9: 'Bestätigt',
        10: 'Archiviert',
        11: 'Gelöscht'
      },
      playMode: 'Spielmodus',
      noTime: 'Keine Zeit festgelegt',
      startTournament: 'Turnier starten',
      unnamed: 'Unbenanntes Event'
    },
    
    // Event Form
    form: {
      newEvent: 'Neues Event erstellen',
      editEvent: 'Event bearbeiten',
      basicInfo: 'Grundinformationen',
      eventDetails: 'Event-Details',
      gameSettings: 'Spieleinstellungen',
      registration: 'Anmeldung',
      eventTitle: 'Event-Titel',
      eventDescription: 'Beschreibung',
      eventDate: 'Datum',
      eventLocation: 'Ort',
      eventSport: 'Sportart',
      eventFormat: 'Format',
      numberOfCourts: 'Anzahl Plätze',
      price: 'Teilnahmegebühr',
      timeSettings: 'Zeiteinstellungen',
      startTime: 'Startzeit',
      endTime: 'Endzeit',
      addBreak: 'Pause hinzufügen',
      breakTime: 'Pausenzeit',
      breakDuration: 'Pausendauer',
      minutes: 'Minuten',
      removeBreak: 'Pause entfernen',
      totalTime: 'Gesamtzeit',
      playerSettings: 'Spielereinstellungen',
      maxPlayers: 'Maximale Spieleranzahl',
      averageGameTime: 'Durchschnittliche Spieldauer',
      minGamesPerPlayer: 'Mindestspiele pro Spieler',
      registrationSettings: 'Anmeldeeinstellungen',
      registrationDeadline: 'Anmeldeschluss',
      allowPublicRegistration: 'Öffentliche Anmeldung erlauben',
      genderRestriction: 'Geschlechtsbeschränkung',
      openToAll: 'Offen für alle',
      menOnly: 'Nur Männer',
      womenOnly: 'Nur Frauen',
      createEvent: 'Event erstellen',
      updateEvent: 'Event aktualisieren',
      cancel: 'Abbrechen'
    },
    
    // Player
    player: {
      players: 'Spieler',
      name: 'Name',
      gender: 'Geschlecht',
      male: 'Männlich',
      female: 'Weiblich',
      skill: 'Spielstärke',
      email: 'E-Mail',
      phone: 'Telefon',
      add: 'Spieler hinzufügen',
      edit: 'Spieler bearbeiten',
      remove: 'Spieler entfernen',
      database: 'Spielerdatenbank',
      selectFromDatabase: 'Aus Datenbank wählen',
      enterName: 'Name eingeben',
      search: 'Spieler suchen...'
    },
    
    // Schedule
    schedule: {
      schedule: 'Spielplan',
      generateSchedule: 'Spielplan generieren',
      round: 'Runde',
      court: 'Platz',
      match: 'Spiel',
      waitingPlayers: 'Wartende Spieler',
      scheduled: 'Geplant',
      chooseSchedule: 'Spielplan auswählen',
      scheduleVariants: 'Wählen Sie eine der drei generierten Varianten für optimale Durchmischung:',
      variant: 'Variante',
      overallFairness: 'Gesamt-Fairness',
      partnerVariety: 'Partner-Vielfalt',
      opponentVariety: 'Gegner-Vielfalt',
      maxPartnerRepeat: 'Max. Partner-Wdh.',
      gameBalance: 'Spiele-Balance',
      firstRounds: 'Erste Runden',
      moreMatches: 'weitere Spiele',
      selectVariant: 'Diese Variante wählen',
      fairnessRating: 'Fairness-Bewertung',
      excellent: 'Exzellent',
      good: 'Gut',
      acceptable: 'Akzeptabel',
      needsImprovement: 'Verbesserungswürdig',
      fairness: 'Fairness'
    },
    
    // Results
    results: {
      results: 'Ergebnisse',
      score: 'Ergebnis',
      winner: 'Gewinner',
      enterResult: 'Ergebnis eintragen',
      finalStandings: 'Endstand',
      matchResults: 'Spielergebnisse'
    },
    
    // Timer
    timer: {
      timer: 'Timer',
      start: 'Start',
      pause: 'Pause',
      resume: 'Fortsetzen',
      stop: 'Stop',
      reset: 'Zurücksetzen',
      roundTime: 'Rundenzeit'
    },
    
    // Tournament
    tournament: {
      running: 'Turnier läuft',
      currentRound: 'Aktuelle Runde',
      standings: 'Tabelle',
      liveStandings: 'Live-Tabelle',
      position: 'Platz',
      points: 'Punkte',
      games: 'Spiele',
      gamesWon: 'Gewonnen',
      completeTournament: 'Turnier beenden',
      cancelTournament: 'Turnier abbrechen',
      allMatchesComplete: 'Alle Spiele abgeschlossen',
      nextRound: 'Nächste Runde',
      previousRound: 'Vorherige Runde',
      currentGames: 'Aktuelle Spiele',
      waitingPlayers: 'Wartende Spieler',
      roundNavigation: 'Runden-Navigation',
      vs: 'vs'
    },
    
    // Messages
    messages: {
      confirmDelete: 'Möchten Sie dieses Event wirklich löschen?',
      minPlayersForSchedule: 'Mindestens 4 Spieler erforderlich',
      tournamentComplete: 'Turnier abgeschlossen!',
      eventDatePast: 'Das Event-Datum liegt in der Vergangenheit',
      minPlayersNeeded: 'Noch {{count}} Spieler benötigt',
      waitingForSchedule: 'Warte auf Spielplan-Generierung durch Turnierdirektor',
      saveSuccess: 'Erfolgreich gespeichert',
      deleteSuccess: 'Erfolgreich gelöscht',
      error: 'Ein Fehler ist aufgetreten'
    },
    
    // Event Types
    eventTypes: {
      americano: 'Americano',
      roundRobin: 'Jeder gegen Jeden',
      swiss: 'Schweizer System',
      knockout: 'K.O.-System'
    },
    
    // Sports
    sports: {
      padel: 'Padel',
      pickleball: 'Pickleball',
      spinxball: 'SpinXball'
    },
    
    // Buttons
    buttons: {
      add: 'Hinzufügen',
      remove: 'Entfernen',
      edit: 'Bearbeiten',
      save: 'Speichern',
      cancel: 'Abbrechen',
      delete: 'Löschen',
      close: 'Schließen',
      confirm: 'Bestätigen',
      back: 'Zurück',
      next: 'Weiter',
      finish: 'Fertigstellen',
      create: 'Erstellen',
      update: 'Aktualisieren',
      search: 'Suchen',
      filter: 'Filtern',
      export: 'Exportieren',
      import: 'Importieren',
      print: 'Drucken',
      share: 'Teilen',
      refresh: 'Aktualisieren'
    },
    
    // Player Database
    database: {
      title: 'Spielerdatenbank',
      selectPlayers: 'Spieler auswählen',
      importExcel: 'Excel importieren',
      exportExcel: 'Excel exportieren',
      addDemoPlayers: 'Demo-Spieler hinzufügen',
      search: 'Nach Name oder E-Mail suchen...',
      selected: '{{count}} ausgewählt',
      noPlayers: 'Keine Spieler in der Datenbank',
      importSuccess: '{{count}} Spieler importiert',
      exportSuccess: 'Spieler exportiert',
      columns: {
        name: 'Name',
        email: 'E-Mail',
        phone: 'Telefon',
        gender: 'Geschlecht',
        skillPadel: 'Padel',
        skillPickleball: 'Pickleball',
        skillSpinxball: 'SpinXball'
      }
    }
  },
  
  // ENGLISCH
  en: {
    // App
    app: {
      title: 'Play2 Tournament',
      loading: 'Loading...',
      noEventsSelected: 'Select an event or create a new one',
      error: 'An error occurred'
    },
    
    // Navigation
    navigation: {
      home: 'Home',
      events: 'Events',
      players: 'Players',
      settings: 'Settings',
      logout: 'Logout',
      edit: 'Edit',
      delete: 'Delete',
      close: 'Close',
      save: 'Save',
      cancel: 'Cancel',
      back: 'Back',
      next: 'Next',
      finish: 'Finish'
    },
    
    // Auth
    auth: {
      login: 'Login',
      signup: 'Sign Up',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      forgotPassword: 'Forgot Password?',
      loginButton: 'Login',
      signupButton: 'Sign Up',
      roleSelection: 'I am a...',
      player: 'Player',
      tournamentDirector: 'Tournament Director',
      noAccount: 'Don\'t have an account?',
      alreadyHaveAccount: 'Already have an account?',
      createAccount: 'Create Account',
      checkEmail: 'Please check your email for confirmation',
      loginSuccess: 'Successfully logged in',
      loading: 'Loading...'
    },
    
    // User Menu
    userMenu: {
      profile: 'Profile',
      settings: 'Settings',
      logout: 'Logout',
      tournamentDirector: 'Tournament Director',
      player: 'Player'
    },
    
    // Event
    event: {
      new: 'New Event',
      edit: 'Edit Event',
      title: 'Title',
      description: 'Description',
      date: 'Date',
      time: 'Time',
      startTime: 'Start Time',
      endTime: 'End Time',
      location: 'Location',
      sport: 'Sport',
      format: {
        title: 'Format',
        single: 'Singles',
        double: 'Doubles'
      },
      courts: 'Courts',
      maxPlayers: 'Max Players',
      participationFee: 'Participation Fee',
      status: {
        upcoming: 'Upcoming',
        scheduled: 'Scheduled',
        draft: 'Draft',
        running: 'Running',
        completed: 'Completed',
        cancelled: 'Cancelled',
        0: 'Upcoming',
        1: 'Scheduled',
        2: 'Draft',
        3: 'Running',
        4: 'Completed',
        5: 'Cancelled',
        6: 'Paused',
        7: 'Postponed',
        8: 'Waitlist',
        9: 'Confirmed',
        10: 'Archived',
        11: 'Deleted'
      },
      playMode: 'Play Mode',
      noTime: 'No time set',
      startTournament: 'Start Tournament',
      unnamed: 'Unnamed Event'
    },
    
    // Event Form
    form: {
      newEvent: 'Create New Event',
      editEvent: 'Edit Event',
      basicInfo: 'Basic Information',
      eventDetails: 'Event Details',
      gameSettings: 'Game Settings',
      registration: 'Registration',
      eventTitle: 'Event Title',
      eventDescription: 'Description',
      eventDate: 'Date',
      eventLocation: 'Location',
      eventSport: 'Sport',
      eventFormat: 'Format',
      numberOfCourts: 'Number of Courts',
      price: 'Participation Fee',
      timeSettings: 'Time Settings',
      startTime: 'Start Time',
      endTime: 'End Time',
      addBreak: 'Add Break',
      breakTime: 'Break Time',
      breakDuration: 'Break Duration',
      minutes: 'Minutes',
      removeBreak: 'Remove Break',
      totalTime: 'Total Time',
      playerSettings: 'Player Settings',
      maxPlayers: 'Maximum Players',
      averageGameTime: 'Average Game Time',
      minGamesPerPlayer: 'Minimum Games per Player',
      registrationSettings: 'Registration Settings',
      registrationDeadline: 'Registration Deadline',
      allowPublicRegistration: 'Allow Public Registration',
      genderRestriction: 'Gender Restriction',
      openToAll: 'Open to All',
      menOnly: 'Men Only',
      womenOnly: 'Women Only',
      createEvent: 'Create Event',
      updateEvent: 'Update Event',
      cancel: 'Cancel'
    },
    
    // Player
    player: {
      players: 'Players',
      name: 'Name',
      gender: 'Gender',
      male: 'Male',
      female: 'Female',
      skill: 'Skill Level',
      email: 'Email',
      phone: 'Phone',
      add: 'Add Player',
      edit: 'Edit Player',
      remove: 'Remove Player',
      database: 'Player Database',
      selectFromDatabase: 'Select from Database',
      enterName: 'Enter name',
      search: 'Search players...'
    },
    
    // Schedule
    schedule: {
      schedule: 'Schedule',
      generateSchedule: 'Generate Schedule',
      round: 'Round',
      court: 'Court',
      match: 'Match',
      waitingPlayers: 'Waiting Players',
      scheduled: 'Scheduled',
      chooseSchedule: 'Choose Schedule',
      scheduleVariants: 'Choose one of three generated variants for optimal mixing:',
      variant: 'Variant',
      overallFairness: 'Overall Fairness',
      partnerVariety: 'Partner Variety',
      opponentVariety: 'Opponent Variety',
      maxPartnerRepeat: 'Max Partner Repeat',
      gameBalance: 'Game Balance',
      firstRounds: 'First Rounds',
      moreMatches: 'more matches',
      selectVariant: 'Select This Variant',
      fairnessRating: 'Fairness Rating',
      excellent: 'Excellent',
      good: 'Good',
      acceptable: 'Acceptable',
      needsImprovement: 'Needs Improvement',
      fairness: 'Fairness'
    },
    
    // Results
    results: {
      results: 'Results',
      score: 'Score',
      winner: 'Winner',
      enterResult: 'Enter Result',
      finalStandings: 'Final Standings',
      matchResults: 'Match Results'
    },
    
    // Timer
    timer: {
      timer: 'Timer',
      start: 'Start',
      pause: 'Pause',
      resume: 'Resume',
      stop: 'Stop',
      reset: 'Reset',
      roundTime: 'Round Time'
    },
    
    // Tournament
    tournament: {
      running: 'Tournament Running',
      currentRound: 'Current Round',
      standings: 'Standings',
      liveStandings: 'Live Standings',
      position: 'Position',
      points: 'Points',
      games: 'Games',
      gamesWon: 'Won',
      completeTournament: 'Complete Tournament',
      cancelTournament: 'Cancel Tournament',
      allMatchesComplete: 'All Matches Complete',
      nextRound: 'Next Round',
      previousRound: 'Previous Round',
      currentGames: 'Current Games',
      waitingPlayers: 'Waiting Players',
      roundNavigation: 'Round Navigation',
      vs: 'vs'
    },
    
    // Messages
    messages: {
      confirmDelete: 'Are you sure you want to delete this event?',
      minPlayersForSchedule: 'At least 4 players required',
      tournamentComplete: 'Tournament completed!',
      eventDatePast: 'Event date is in the past',
      minPlayersNeeded: '{{count}} more players needed',
      waitingForSchedule: 'Waiting for schedule generation by tournament director',
      saveSuccess: 'Successfully saved',
      deleteSuccess: 'Successfully deleted',
      error: 'An error occurred'
    },
    
    // Event Types
    eventTypes: {
      americano: 'Americano',
      roundRobin: 'Round Robin',
      swiss: 'Swiss System',
      knockout: 'Knockout'
    },
    
    // Sports
    sports: {
      padel: 'Padel',
      pickleball: 'Pickleball',
      spinxball: 'SpinXball'
    },
    
    // Buttons
    buttons: {
      add: 'Add',
      remove: 'Remove',
      edit: 'Edit',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      close: 'Close',
      confirm: 'Confirm',
      back: 'Back',
      next: 'Next',
      finish: 'Finish',
      create: 'Create',
      update: 'Update',
      search: 'Search',
      filter: 'Filter',
      export: 'Export',
      import: 'Import',
      print: 'Print',
      share: 'Share',
      refresh: 'Refresh'
    },
    
    // Player Database
    database: {
      title: 'Player Database',
      selectPlayers: 'Select Players',
      importExcel: 'Import Excel',
      exportExcel: 'Export Excel',
      addDemoPlayers: 'Add Demo Players',
      search: 'Search by name or email...',
      selected: '{{count}} selected',
      noPlayers: 'No players in database',
      importSuccess: '{{count}} players imported',
      exportSuccess: 'Players exported',
      columns: {
        name: 'Name',
        email: 'Email',
        phone: 'Phone',
        gender: 'Gender',
        skillPadel: 'Padel',
        skillPickleball: 'Pickleball',
        skillSpinxball: 'SpinXball'
      }
    }
  },
  
  // SPANISCH
  es: {
    // App
    app: {
      title: 'Play2 Tournament',
      loading: 'Cargando...',
      noEventsSelected: 'Selecciona un evento o crea uno nuevo',
      error: 'Ha ocurrido un error'
    },
    
    // Navigation
    navigation: {
      home: 'Inicio',
      events: 'Eventos',
      players: 'Jugadores',
      settings: 'Configuración',
      logout: 'Cerrar sesión',
      edit: 'Editar',
      delete: 'Eliminar',
      close: 'Cerrar',
      save: 'Guardar',
      cancel: 'Cancelar',
      back: 'Atrás',
      next: 'Siguiente',
      finish: 'Finalizar'
    },
    
    // Auth
    auth: {
      login: 'Iniciar sesión',
      signup: 'Registrarse',
      email: 'Correo electrónico',
      password: 'Contraseña',
      confirmPassword: 'Confirmar contraseña',
      forgotPassword: '¿Olvidaste tu contraseña?',
      loginButton: 'Iniciar sesión',
      signupButton: 'Registrarse',
      roleSelection: 'Soy...',
      player: 'Jugador',
      tournamentDirector: 'Director de torneo',
      noAccount: '¿No tienes cuenta?',
      alreadyHaveAccount: '¿Ya tienes cuenta?',
      createAccount: 'Crear cuenta',
      checkEmail: 'Por favor revisa tu correo para confirmar',
      loginSuccess: 'Sesión iniciada correctamente',
      loading: 'Cargando...'
    },
    
    // User Menu
    userMenu: {
      profile: 'Perfil',
      settings: 'Configuración',
      logout: 'Cerrar sesión',
      tournamentDirector: 'Director de torneo',
      player: 'Jugador'
    },
    
    // Event
    event: {
      new: 'Nuevo evento',
      edit: 'Editar evento',
      title: 'Título',
      description: 'Descripción',
      date: 'Fecha',
      time: 'Hora',
      startTime: 'Hora de inicio',
      endTime: 'Hora de fin',
      location: 'Ubicación',
      sport: 'Deporte',
      format: {
        title: 'Formato',
        single: 'Individual',
        double: 'Dobles'
      },
      courts: 'Pistas',
      maxPlayers: 'Máx. jugadores',
      participationFee: 'Cuota de participación',
      status: {
        upcoming: 'Próximo',
        scheduled: 'Programado',
        draft: 'Borrador',
        running: 'En curso',
        completed: 'Completado',
        cancelled: 'Cancelado',
        0: 'Próximo',
        1: 'Programado',
        2: 'Borrador',
        3: 'En curso',
        4: 'Completado',
        5: 'Cancelado',
        6: 'Pausado',
        7: 'Pospuesto',
        8: 'Lista de espera',
        9: 'Confirmado',
        10: 'Archivado',
        11: 'Eliminado'
      },
      playMode: 'Modo de juego',
      noTime: 'Sin hora establecida',
      startTournament: 'Iniciar torneo',
      unnamed: 'Evento sin nombre'
    },
    
    // Event Form
    form: {
      newEvent: 'Crear nuevo evento',
      editEvent: 'Editar evento',
      basicInfo: 'Información básica',
      eventDetails: 'Detalles del evento',
      gameSettings: 'Configuración de juego',
      registration: 'Inscripción',
      eventTitle: 'Título del evento',
      eventDescription: 'Descripción',
      eventDate: 'Fecha',
      eventLocation: 'Ubicación',
      eventSport: 'Deporte',
      eventFormat: 'Formato',
      numberOfCourts: 'Número de pistas',
      price: 'Cuota de participación',
      timeSettings: 'Configuración de tiempo',
      startTime: 'Hora de inicio',
      endTime: 'Hora de fin',
      addBreak: 'Añadir descanso',
      breakTime: 'Hora del descanso',
      breakDuration: 'Duración del descanso',
      minutes: 'Minutos',
      removeBreak: 'Eliminar descanso',
      totalTime: 'Tiempo total',
      playerSettings: 'Configuración de jugadores',
      maxPlayers: 'Número máximo de jugadores',
      averageGameTime: 'Duración promedio del juego',
      minGamesPerPlayer: 'Juegos mínimos por jugador',
      registrationSettings: 'Configuración de inscripción',
      registrationDeadline: 'Fecha límite de inscripción',
      allowPublicRegistration: 'Permitir inscripción pública',
      genderRestriction: 'Restricción de género',
      openToAll: 'Abierto a todos',
      menOnly: 'Solo hombres',
      womenOnly: 'Solo mujeres',
      createEvent: 'Crear evento',
      updateEvent: 'Actualizar evento',
      cancel: 'Cancelar'
    },
    
    // Player
    player: {
      players: 'Jugadores',
      name: 'Nombre',
      gender: 'Género',
      male: 'Masculino',
      female: 'Femenino',
      skill: 'Nivel',
      email: 'Correo',
      phone: 'Teléfono',
      add: 'Añadir jugador',
      edit: 'Editar jugador',
      remove: 'Eliminar jugador',
      database: 'Base de datos de jugadores',
      selectFromDatabase: 'Seleccionar de base de datos',
      enterName: 'Introducir nombre',
      search: 'Buscar jugadores...'
    },
    
    // Schedule
    schedule: {
      schedule: 'Calendario',
      generateSchedule: 'Generar calendario',
      round: 'Ronda',
      court: 'Pista',
      match: 'Partido',
      waitingPlayers: 'Jugadores esperando',
      scheduled: 'Programado',
      chooseSchedule: 'Elegir calendario',
      scheduleVariants: 'Elige una de las tres variantes generadas para una mezcla óptima:',
      variant: 'Variante',
      overallFairness: 'Equidad general',
      partnerVariety: 'Variedad de parejas',
      opponentVariety: 'Variedad de oponentes',
      maxPartnerRepeat: 'Máx. repetición pareja',
      gameBalance: 'Balance de juegos',
      firstRounds: 'Primeras rondas',
      moreMatches: 'más partidos',
      selectVariant: 'Seleccionar esta variante',
      fairnessRating: 'Calificación de equidad',
      excellent: 'Excelente',
      good: 'Bueno',
      acceptable: 'Aceptable',
      needsImprovement: 'Necesita mejora',
      fairness: 'Equidad'
    },
    
    // Results
    results: {
      results: 'Resultados',
      score: 'Puntuación',
      winner: 'Ganador',
      enterResult: 'Introducir resultado',
      finalStandings: 'Clasificación final',
      matchResults: 'Resultados de partidos'
    },
    
    // Timer
    timer: {
      timer: 'Cronómetro',
      start: 'Iniciar',
      pause: 'Pausar',
      resume: 'Reanudar',
      stop: 'Detener',
      reset: 'Reiniciar',
      roundTime: 'Tiempo de ronda'
    },
    
    // Tournament
    tournament: {
      running: 'Torneo en curso',
      currentRound: 'Ronda actual',
      standings: 'Clasificación',
      liveStandings: 'Clasificación en vivo',
      position: 'Posición',
      points: 'Puntos',
      games: 'Juegos',
      gamesWon: 'Ganados',
      completeTournament: 'Finalizar torneo',
      cancelTournament: 'Cancelar torneo',
      allMatchesComplete: 'Todos los partidos completados',
      nextRound: 'Siguiente ronda',
      previousRound: 'Ronda anterior',
      currentGames: 'Juegos actuales',
      waitingPlayers: 'Jugadores esperando',
      roundNavigation: 'Navegación de rondas',
      vs: 'vs'
    },
    
    // Messages
    messages: {
      confirmDelete: '¿Estás seguro de que quieres eliminar este evento?',
      minPlayersForSchedule: 'Se requieren al menos 4 jugadores',
      tournamentComplete: '¡Torneo completado!',
      eventDatePast: 'La fecha del evento ya pasó',
      minPlayersNeeded: 'Faltan {{count}} jugadores',
      waitingForSchedule: 'Esperando generación de calendario por el director del torneo',
      saveSuccess: 'Guardado correctamente',
      deleteSuccess: 'Eliminado correctamente',
      error: 'Ha ocurrido un error'
    },
    
    // Event Types
    eventTypes: {
      americano: 'Americano',
      roundRobin: 'Todos contra todos',
      swiss: 'Sistema suizo',
      knockout: 'Eliminación directa'
    },
    
    // Sports
    sports: {
      padel: 'Pádel',
      pickleball: 'Pickleball',
      spinxball: 'SpinXball'
    },
    
    // Buttons
    buttons: {
      add: 'Añadir',
      remove: 'Eliminar',
      edit: 'Editar',
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      close: 'Cerrar',
      confirm: 'Confirmar',
      back: 'Atrás',
      next: 'Siguiente',
      finish: 'Finalizar',
      create: 'Crear',
      update: 'Actualizar',
      search: 'Buscar',
      filter: 'Filtrar',
      export: 'Exportar',
      import: 'Importar',
      print: 'Imprimir',
      share: 'Compartir',
      refresh: 'Actualizar'
    },
    
    // Player Database
    database: {
      title: 'Base de datos de jugadores',
      selectPlayers: 'Seleccionar jugadores',
      importExcel: 'Importar Excel',
      exportExcel: 'Exportar Excel',
      addDemoPlayers: 'Añadir jugadores demo',
      search: 'Buscar por nombre o correo...',
      selected: '{{count}} seleccionados',
      noPlayers: 'No hay jugadores en la base de datos',
      importSuccess: '{{count}} jugadores importados',
      exportSuccess: 'Jugadores exportados',
      columns: {
        name: 'Nombre',
        email: 'Correo',
        phone: 'Teléfono',
        gender: 'Género',
        skillPadel: 'Pádel',
        skillPickleball: 'Pickleball',
        skillSpinxball: 'SpinXball'
      }
    }
  }
}

// Helper function for interpolation
export const interpolate = (str, params) => {
  if (!params) return str
  
  let result = str
  Object.keys(params).forEach(key => {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), params[key])
  })
  return result
}