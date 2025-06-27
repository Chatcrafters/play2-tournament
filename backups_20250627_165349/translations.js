// src/utils/translations.js
export const translations = {
  de: {
    app: {
      title: "Play2 Tournament",
      loading: "Lade Events...",
      noEventsSelected: "Wählen Sie ein Event aus oder erstellen Sie ein neues."
    },
    
    navigation: {
      back: "Zurück",
      backToOverview: "Zurück zur Übersicht",
      next: "Weiter",
      previous: "Zurück",
      save: "Speichern",
      cancel: "Abbrechen",
      delete: "Löschen",
      edit: "Bearbeiten",
      close: "Schließen"
    },
    
    auth: {
      login: "Anmelden",
      logout: "Abmelden",
      register: "Registrieren",
      email: "E-Mail",
      password: "Passwort",
      confirmPassword: "Passwort bestätigen",
      forgotPassword: "Passwort vergessen?",
      loginError: "Fehler bei der Anmeldung",
      registerError: "Fehler bei der Registrierung",
      welcome: "Willkommen bei Play2 Tournament"
    },
    
    event: {
      new: "Neues Event",
      create: "Event erstellen",
      edit: "Event bearbeiten",
      myEvents: "Meine Events",
      title: "Event Name",
      description: "Beschreibung",
      sport: "Sportart",
      type: "Event-Typ",
      date: "Datum",
      time: "Zeit",
      startTime: "Startzeit",
      endTime: "Endzeit",
      location: "Ort",
      courts: "Anzahl Plätze",
      maxPlayers: "Max. Spieler",
      status: {
        upcoming: "Geplant",
        running: "Läuft",
        completed: "Abgeschlossen",
        today: "Heute",
        past: "Vergangen"
      },
      share: "Event teilen",
      startTournament: "Turnier starten"
    },
    
    sports: {
      padel: "Padel",
      pickleball: "Pickleball",
      spinxball: "SpinXball"
    },
    
    eventTypes: {
      americano: "Americano",
      roundRobin: "Round Robin",
      tournament: "Turnier",
      liga: "Liga"
    },
    
    player: {
      players: "Spieler",
      addPlayer: "Spieler hinzufügen",
      fromDatabase: "Aus Datenbank",
      name: "Name",
      gender: "Geschlecht",
      male: "Männlich",
      female: "Weiblich",
      skillLevel: "Spielstärke",
      email: "E-Mail",
      phone: "Telefon",
      noPlayers: "Noch keine Spieler hinzugefügt",
      playerCount: "{{count}} von {{max}} Spielern angemeldet",
      database: "Spieler-Datenbank",
      import: "Importieren",
      export: "Exportieren",
      managePlayer: "Spieler verwalten"
    },
    
    schedule: {
      schedule: "Spielplan",
      generateSchedule: "Spielplan generieren",
      regenerate: "Neu generieren",
      round: "Runde",
      court: "Platz",
      waiting: "Pausiert",
      minGamesGuaranteed: "Mind. {{count}} Spiele garantiert",
      minTimeGuaranteed: "Mind. {{minutes}} Minuten garantiert",
      roundDuration: "Rundenzeit (Minuten)",
      totalTime: "Gesamtzeit",
      netPlayTime: "Netto-Spielzeit",
      possibleRounds: "Mögliche Runden",
      breaks: "Pausen"
    },
    
    timer: {
      start: "Start",
      pause: "Pause",
      resume: "Fortsetzen",
      stop: "Stop",
      reset: "Reset",
      timeRemaining: "Verbleibende Zeit",
      roundTime: "Rundenzeit"
    },
    
    results: {
      results: "Ergebnisse",
      enterResult: "Ergebnis eingeben",
      score: "Ergebnis",
      points: "Punkte",
      games: "Spiele",
      gamesWon: "Gewonnene Spiele",
      standings: "Tabelle",
      rank: "Rang",
      wins: "Siege",
      losses: "Niederlagen",
      noResults: "Noch keine Ergebnisse eingetragen"
    },
    
    messages: {
      eventCreated: "Event erfolgreich erstellt",
      eventUpdated: "Event erfolgreich aktualisiert",
      eventDeleted: "Event erfolgreich gelöscht",
      scheduleGenerated: "Spielplan erfolgreich generiert",
      resultSaved: "Ergebnis gespeichert",
      playerAdded: "Spieler hinzugefügt",
      playerRemoved: "Spieler entfernt",
      confirmDelete: "Möchten Sie dieses Event wirklich löschen?",
      tournamentComplete: "Turnier abgeschlossen!",
      minPlayersRequired: "Noch {{count}} Spieler benötigt zum Starten",
      tournamentCanStart: "Turnier kann gestartet werden",
      eventDatePast: "Event-Datum ist vorbei"
    },
    
    buttons: {
      addFromDatabase: "Aus Datenbank",
      shareEvent: "Event teilen",
      startTournament: "Turnier starten",
      editEvent: "Bearbeiten"
    }
  },
  
  en: {
    app: {
      title: "Play2 Tournament",
      loading: "Loading events...",
      noEventsSelected: "Select an event or create a new one."
    },
    
    navigation: {
      back: "Back",
      backToOverview: "Back to overview",
      next: "Next",
      previous: "Previous",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      close: "Close"
    },
    
    auth: {
      login: "Login",
      logout: "Logout",
      register: "Register",
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm Password",
      forgotPassword: "Forgot Password?",
      loginError: "Login error",
      registerError: "Registration error",
      welcome: "Welcome to Play2 Tournament"
    },
    
    event: {
      new: "New Event",
      create: "Create Event",
      edit: "Edit Event",
      myEvents: "My Events",
      title: "Event Name",
      description: "Description",
      sport: "Sport",
      type: "Event Type",
      date: "Date",
      time: "Time",
      startTime: "Start Time",
      endTime: "End Time",
      location: "Location",
      courts: "Number of Courts",
      maxPlayers: "Max Players",
      status: {
        upcoming: "Upcoming",
        running: "Running",
        completed: "Completed",
        today: "Today",
        past: "Past"
      },
      share: "Share Event",
      startTournament: "Start Tournament"
    },
    
    sports: {
      padel: "Padel",
      pickleball: "Pickleball",
      spinxball: "SpinXball"
    },
    
    eventTypes: {
      americano: "Americano",
      roundRobin: "Round Robin",
      tournament: "Tournament",
      liga: "League"
    },
    
    player: {
      players: "Players",
      addPlayer: "Add Player",
      fromDatabase: "From Database",
      name: "Name",
      gender: "Gender",
      male: "Male",
      female: "Female",
      skillLevel: "Skill Level",
      email: "Email",
      phone: "Phone",
      noPlayers: "No players added yet",
      playerCount: "{{count}} of {{max}} players registered",
      database: "Player Database",
      import: "Import",
      export: "Export",
      managePlayer: "Manage Players"
    },
    
    schedule: {
      schedule: "Schedule",
      generateSchedule: "Generate Schedule",
      regenerate: "Regenerate",
      round: "Round",
      court: "Court",
      waiting: "Waiting",
      minGamesGuaranteed: "Min. {{count}} games guaranteed",
      minTimeGuaranteed: "Min. {{minutes}} minutes guaranteed",
      roundDuration: "Round Duration (minutes)",
      totalTime: "Total Time",
      netPlayTime: "Net Play Time",
      possibleRounds: "Possible Rounds",
      breaks: "Breaks"
    },
    
    timer: {
      start: "Start",
      pause: "Pause",
      resume: "Resume",
      stop: "Stop",
      reset: "Reset",
      timeRemaining: "Time Remaining",
      roundTime: "Round Time"
    },
    
    results: {
      results: "Results",
      enterResult: "Enter Result",
      score: "Score",
      points: "Points",
      games: "Games",
      gamesWon: "Games Won",
      standings: "Standings",
      rank: "Rank",
      wins: "Wins",
      losses: "Losses",
      noResults: "No results entered yet"
    },
    
    messages: {
      eventCreated: "Event created successfully",
      eventUpdated: "Event updated successfully",
      eventDeleted: "Event deleted successfully",
      scheduleGenerated: "Schedule generated successfully",
      resultSaved: "Result saved",
      playerAdded: "Player added",
      playerRemoved: "Player removed",
      confirmDelete: "Are you sure you want to delete this event?",
      tournamentComplete: "Tournament complete!",
      minPlayersRequired: "Need {{count}} more players to start",
      tournamentCanStart: "Tournament can be started",
      eventDatePast: "Event date has passed"
    },
    
    buttons: {
      addFromDatabase: "From Database",
      shareEvent: "Share Event",
      startTournament: "Start Tournament",
      editEvent: "Edit"
    }
  },
  
  es: {
    app: {
      title: "Play2 Tournament",
      loading: "Cargando eventos...",
      noEventsSelected: "Selecciona un evento o crea uno nuevo."
    },
    
    navigation: {
      back: "Atrás",
      backToOverview: "Volver al resumen",
      next: "Siguiente",
      previous: "Anterior",
      save: "Guardar",
      cancel: "Cancelar",
      delete: "Eliminar",
      edit: "Editar",
      close: "Cerrar"
    },
    
    auth: {
      login: "Iniciar sesión",
      logout: "Cerrar sesión",
      register: "Registrarse",
      email: "Correo electrónico",
      password: "Contraseña",
      confirmPassword: "Confirmar contraseña",
      forgotPassword: "¿Olvidaste tu contraseña?",
      loginError: "Error al iniciar sesión",
      registerError: "Error al registrarse",
      welcome: "Bienvenido a Play2 Tournament"
    },
    
    event: {
      new: "Nuevo Evento",
      create: "Crear Evento",
      edit: "Editar Evento",
      myEvents: "Mis Eventos",
      title: "Nombre del Evento",
      description: "Descripción",
      sport: "Deporte",
      type: "Tipo de Evento",
      date: "Fecha",
      time: "Hora",
      startTime: "Hora de inicio",
      endTime: "Hora de fin",
      location: "Ubicación",
      courts: "Número de pistas",
      maxPlayers: "Máx. jugadores",
      status: {
        upcoming: "Próximo",
        running: "En curso",
        completed: "Completado",
        today: "Hoy",
        past: "Pasado"
      },
      share: "Compartir Evento",
      startTournament: "Iniciar Torneo"
    },
    
    sports: {
      padel: "Pádel",
      pickleball: "Pickleball",
      spinxball: "SpinXball"
    },
    
    eventTypes: {
      americano: "Americano",
      roundRobin: "Round Robin",
      tournament: "Torneo",
      liga: "Liga"
    },
    
    player: {
      players: "Jugadores",
      addPlayer: "Añadir Jugador",
      fromDatabase: "Desde Base de Datos",
      name: "Nombre",
      gender: "Género",
      male: "Masculino",
      female: "Femenino",
      skillLevel: "Nivel",
      email: "Correo electrónico",
      phone: "Teléfono",
      noPlayers: "Aún no se han añadido jugadores",
      playerCount: "{{count}} de {{max}} jugadores inscritos",
      database: "Base de Datos de Jugadores",
      import: "Importar",
      export: "Exportar",
      managePlayer: "Gestionar jugadores"
    },
    
    schedule: {
      schedule: "Horario",
      generateSchedule: "Generar Horario",
      regenerate: "Regenerar",
      round: "Ronda",
      court: "Pista",
      waiting: "En espera",
      minGamesGuaranteed: "Mín. {{count}} partidos garantizados",
      minTimeGuaranteed: "Mín. {{minutes}} minutos garantizados",
      roundDuration: "Duración de ronda (minutos)",
      totalTime: "Tiempo total",
      netPlayTime: "Tiempo neto de juego",
      possibleRounds: "Rondas posibles",
      breaks: "Descansos"
    },
    
    timer: {
      start: "Iniciar",
      pause: "Pausar",
      resume: "Reanudar",
      stop: "Detener",
      reset: "Reiniciar",
      timeRemaining: "Tiempo restante",
      roundTime: "Tiempo de ronda"
    },
    
    results: {
      results: "Resultados",
      enterResult: "Introducir Resultado",
      score: "Puntuación",
      points: "Puntos",
      games: "Partidos",
      gamesWon: "Partidos ganados",
      standings: "Clasificación",
      rank: "Posición",
      wins: "Victorias",
      losses: "Derrotas",
      noResults: "Aún no hay resultados"
    },
    
    messages: {
      eventCreated: "Evento creado con éxito",
      eventUpdated: "Evento actualizado con éxito",
      eventDeleted: "Evento eliminado con éxito",
      scheduleGenerated: "Horario generado con éxito",
      resultSaved: "Resultado guardado",
      playerAdded: "Jugador añadido",
      playerRemoved: "Jugador eliminado",
      confirmDelete: "¿Estás seguro de que quieres eliminar este evento?",
      tournamentComplete: "¡Torneo completado!",
      minPlayersRequired: "Faltan {{count}} jugadores para empezar",
      tournamentCanStart: "El torneo puede comenzar",
      eventDatePast: "La fecha del evento ha pasado"
    },
    
    buttons: {
      addFromDatabase: "Desde Base de Datos",
      shareEvent: "Compartir Evento",
      startTournament: "Iniciar Torneo",
      editEvent: "Editar"
    }
  }
}

// Helper function to replace template variables
export const interpolate = (str, params) => {
  if (!params) return str
  
  let result = str
  Object.keys(params).forEach(key => {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), params[key])
  })
  return result
}
