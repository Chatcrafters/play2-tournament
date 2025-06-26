import React, { createContext, useContext, useState } from 'react'
import { Globe } from 'lucide-react'

// Übersetzungen
const translations = {
  de: {
    app: {
      title: "Play2 Tournament",
      loading: "Lade Events...",
      noEventsSelected: "Wählen Sie ein Event aus oder erstellen Sie ein neues."
    },
    navigation: {
      back: "Zurück",
      save: "Speichern",
      cancel: "Abbrechen",
      delete: "Löschen",
      edit: "Bearbeiten",
      next: "Weiter"
    },
    event: {
      new: "Neues Event",
      create: "Event erstellen",
      myEvents: "Meine Events",
      title: "Event Name",
      sport: "Sportart",
      date: "Datum",
      startTime: "Startzeit",
      endTime: "Endzeit",
      location: "Ort",
      courts: "Anzahl Plätze",
      maxPlayers: "Max. Spieler",
      share: "Event teilen",
      startTournament: "Turnier starten",
      status: {
        upcoming: "Geplant",
        running: "Läuft",
        completed: "Abgeschlossen",
        today: "Heute",
        past: "Vergangen"
      },
      noEvents: "Keine Events vorhanden"
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
      name: "Name",
      gender: "Geschlecht",
      male: "Männlich",
      female: "Weiblich",
      skillLevel: "Spielstärke",
      fromDatabase: "Aus Datenbank",
      managePlayer: "Spieler verwalten",
      noPlayers: "Keine Spieler vorhanden",
      level: "Level"
    },
    messages: {
      confirmDelete: "Möchten Sie dieses Event wirklich löschen?",
      tournamentComplete: "Turnier abgeschlossen!"
    },
    tournament: {
      round: "Runde",
      match: "Spiel",
      court: "Platz",
      points: "Punkte",
      games: "Spiele",
      score: "Ergebnis",
      winner: "Gewinner",
      standings: "Tabelle",
      nextMatch: "Nächstes Spiel",
      currentMatch: "Aktuelles Spiel",
      completedMatches: "Beendete Spiele",
      upcomingMatches: "Kommende Spiele"
    },
    playerManagement: {
      manage: "Spieler verwalten",
      enterName: "Spielername eingeben...",
      fromDatabase: "Aus Datenbank",
      detailsFor: "Details für",
      skillLevel: "Skill Level",
      addPlayer: "Spieler hinzufügen",
      noPlayersYet: "Noch keine Spieler hinzugefügt",
      eventFull: "Das Event ist voll. Entfernen Sie Spieler, um neue hinzuzufügen.",
      menOnly: "Nur Männer können teilnehmen",
      womenOnly: "Nur Frauen können teilnehmen",
      menEventNote: "Hinweis: Dies ist ein Männer-Event",
      womenEventNote: "Hinweis: Dies ist ein Frauen-Event",
      beginner: "Anfänger",
      advanced: "Fortgeschritten",
      good: "Gut",
      veryGood: "Sehr gut",
      expert: "Experte",
      beginnerLong: "Anfänger",
      advancedBeginner: "Fortgeschrittener Anfänger",
      lowerIntermediate: "Unteres Mittelstufe",
      goodIntermediate: "Gutes Mittelstufe",
      upperIntermediate: "Oberes Mittelstufe",
      advancedPro: "Fortgeschritten/Profi"
    },
    form: {
      editEvent: "Event bearbeiten",
      createEvent: "Neues Event erstellen",
      eventBasics: "Event-Grundlagen",
      eventName: "Event Name",
      required: "Pflichtfeld",
      sport: "Sportart",
      eventType: "Event-Typ",
      genderMode: "Geschlechtsmodus",
      mixed: "Mixed / Open",
      menOnly: "Nur Herren",
      womenOnly: "Nur Damen",
      when: "Wann findet das Event statt?",
      date: "Datum",
      startTime: "Startzeit",
      endTime: "Endzeit",
      numberOfCourts: "Anzahl Plätze",
      location: "Ort",
      contactPhone: "Kontakt-Telefon",
      howToPlay: "Wie soll gespielt werden?",
      roundDuration: "Rundenzeit (Minuten)",
      playMode: "Spielmodus auswählen",
      relaxed: "Entspannt",
      relaxedDesc: "Viel Pause zwischen den Spielen, ideal für Social Events",
      balanced: "Ausgewogen",
      balancedDesc: "Mind. 3 Spiele garantiert, gute Balance",
      intensive: "Intensiv",
      intensiveDesc: "Maximale Spielzeit für alle Teilnehmer",
      breaks: "Pausen planen",
      addBreak: "Pause hinzufügen",
      maxPlayers: "Maximale Spieleranzahl festlegen",
      recommendations: "Intelligente Empfehlungen für Ihr Event",
      optimal: "Optimal",
      optimalDesc: "Alle spielen regelmäßig ohne lange Pausen",
      maximum: "Maximum",
      withGuarantees: "Bei gewählten Garantien",
      adopt: "Übernehmen",
      preview: "Vorschau mit",
      gamesPerPerson: "Spiele pro Person",
      playTimePerPerson: "Spielzeit pro Person",
      breakTime: "Pausenzeit",
      utilization: "Auslastung",
      additionalInfo: "Weitere Informationen (optional)",
      eventDescription: "Event-Beschreibung",
      visibility: "Sichtbarkeit & Anmeldung",
      makePublic: "Event öffentlich sichtbar machen",
      publicDesc: "Andere Nutzer können das Event finden und ansehen",
      enableRegistration: "Online-Anmeldung aktivieren",
      registrationDesc: "Spieler können sich selbst anmelden",
      registrationDeadline: "Anmeldeschluss",
      entryFee: "Startgebühr (€)",
      summary: "Event-Zusammenfassung",
      noName: "Kein Name",
      noDate: "Kein Datum",
      notSpecified: "Nicht angegeben",
      public: "Öffentlich",
      private: "Privat",
      registrationOpen: "Anmeldung offen",
      totalTime: "Gesamtzeit",
      netPlayTime: "Netto-Spielzeit",
      possibleRounds: "Mögliche Runden",
      min: "Min",
      quickTemplates: "Schnellstart-Vorlagen",
      selectTemplate: "Wählen Sie eine Vorlage für einen schnellen Start",
      training: "Training",
      tournament: "Turnier",
      league: "Liga",
      social: "Social",
      trainingDesc: "2h, 8-12 Spieler",
      tournamentDesc: "4h, 16-24 Spieler",
      leagueDesc: "Ganztags-Event",
      socialDesc: "3h, flexibel",
      advancedSettings: "Erweiterte Einstellungen anzeigen",
      guaranteeGames: "Mindestanzahl Spiele garantieren",
      minGamesPerPlayer: "Mindestspiele pro Spieler",
      guaranteeTime: "Mindestspielzeit garantieren",
      minPlayTime: "Mindestspielzeit (Minuten)",
      warning: "Achtung",
      guaranteeWarning: "Mit {players} Spielern können die gewählten Garantien nicht eingehalten werden!",
      recommendedMax: "Empfohlene maximale Spieleranzahl",
      proceedAnyway: "Trotzdem fortfahren?",
      atLeast4Players: "Mindestens 4 Spieler erforderlich",
      saveChanges: "Änderungen speichern",
      pauseName: "Pausenname",
      coffeBreak: "Kaffee & Kuchen",
      lunchBreak: "Mittagspause",
      steps: {
        basics: "Grundlagen",
        timeLocation: "Zeit & Ort",
        playMode: "Spielmodus",
        players: "Teilnehmer",
        details: "Details"
      },
      americano: "Americano",
      americanoDesc: "Turnier mit wechselnden Partnern",
      selectSportTooltip: "Wählen Sie die Sportart für Ihr Event",
      americanoTooltip: "Americano: Jeder spielt mit wechselnden Partnern gegen wechselnde Gegner",
      courtsTooltip: "Wie viele Plätze stehen gleichzeitig zur Verfügung?",
      roundDurationTooltip: "Wie lange dauert eine Spielrunde? Üblich sind 10-20 Minuten",
      time: "Zeit",
      eventDescriptionPlaceholder: "Zusätzliche Informationen für die Teilnehmer...",
      tournamentTooltip: "Klassisches Turnier-Format",
      leagueTooltip: "Liga-Spieltag Format",
      socialTooltip: "Lockeres Social-Event"
    },
    validation: {
      nameRequired: "Name ist erforderlich",
      dateRequired: "Datum ist erforderlich",
      timeRequired: "Zeit ist erforderlich",
      courtsRequired: "Plätze sind erforderlich",
      minPlayers: "Mindestens 4 Spieler erforderlich"
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
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      next: "Next"
    },
    event: {
      new: "New Event",
      create: "Create Event",
      myEvents: "My Events",
      title: "Event Name",
      sport: "Sport",
      date: "Date",
      startTime: "Start Time",
      endTime: "End Time",
      location: "Location",
      courts: "Number of Courts",
      maxPlayers: "Max Players",
      share: "Share Event",
      startTournament: "Start Tournament",
      status: {
        upcoming: "Upcoming",
        running: "Running",
        completed: "Completed",
        today: "Today",
        past: "Past"
      },
      noEvents: "No events available"
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
      name: "Name",
      gender: "Gender",
      male: "Male",
      female: "Female",
      skillLevel: "Skill Level",
      fromDatabase: "From Database",
      managePlayer: "Manage Players",
      noPlayers: "No players available",
      level: "Level"
    },
    messages: {
      confirmDelete: "Are you sure you want to delete this event?",
      tournamentComplete: "Tournament complete!"
    },
    tournament: {
      round: "Round",
      match: "Match",
      court: "Court",
      points: "Points",
      games: "Games",
      score: "Score",
      winner: "Winner",
      standings: "Standings",
      nextMatch: "Next Match",
      currentMatch: "Current Match",
      completedMatches: "Completed Matches",
      upcomingMatches: "Upcoming Matches"
    },
    playerManagement: {
      manage: "Manage Players",
      enterName: "Enter player name...",
      fromDatabase: "From Database",
      detailsFor: "Details for",
      skillLevel: "Skill Level",
      addPlayer: "Add Player",
      noPlayersYet: "No players added yet",
      eventFull: "Event is full. Remove players to add new ones.",
      menOnly: "Men only",
      womenOnly: "Women only",
      menEventNote: "Note: This is a men's event",
      womenEventNote: "Note: This is a women's event",
      beginner: "Beginner",
      advanced: "Advanced",
      good: "Good",
      veryGood: "Very Good",
      expert: "Expert",
      beginnerLong: "Beginner",
      advancedBeginner: "Advanced Beginner",
      lowerIntermediate: "Lower Intermediate",
      goodIntermediate: "Good Intermediate",
      upperIntermediate: "Upper Intermediate",
      advancedPro: "Advanced/Pro"
    },
    form: {
      editEvent: "Edit Event",
      createEvent: "Create New Event",
      eventBasics: "Event Basics",
      eventName: "Event Name",
      required: "Required",
      sport: "Sport",
      eventType: "Event Type",
      genderMode: "Gender Mode",
      mixed: "Mixed / Open",
      menOnly: "Men Only",
      womenOnly: "Women Only",
      when: "When will the event take place?",
      date: "Date",
      startTime: "Start Time",
      endTime: "End Time",
      numberOfCourts: "Number of Courts",
      location: "Location",
      contactPhone: "Contact Phone",
      howToPlay: "How to play?",
      roundDuration: "Round Duration (Minutes)",
      playMode: "Select Play Mode",
      relaxed: "Relaxed",
      relaxedDesc: "Lots of breaks between games, ideal for social events",
      balanced: "Balanced",
      balancedDesc: "Min. 3 games guaranteed, good balance",
      intensive: "Intensive",
      intensiveDesc: "Maximum playing time for all participants",
      breaks: "Plan Breaks",
      addBreak: "Add Break",
      maxPlayers: "Set Maximum Players",
      recommendations: "Smart Recommendations for Your Event",
      optimal: "Optimal",
      optimalDesc: "Everyone plays regularly without long breaks",
      maximum: "Maximum",
      withGuarantees: "With selected guarantees",
      adopt: "Apply",
      preview: "Preview with",
      gamesPerPerson: "Games per Person",
      playTimePerPerson: "Play Time per Person",
      breakTime: "Break Time",
      utilization: "Utilization",
      additionalInfo: "Additional Information (optional)",
      eventDescription: "Event Description",
      visibility: "Visibility & Registration",
      makePublic: "Make event publicly visible",
      publicDesc: "Other users can find and view the event",
      enableRegistration: "Enable online registration",
      registrationDesc: "Players can register themselves",
      registrationDeadline: "Registration Deadline",
      entryFee: "Entry Fee (€)",
      summary: "Event Summary",
      noName: "No Name",
      noDate: "No Date",
      notSpecified: "Not Specified",
      public: "Public",
      private: "Private",
      registrationOpen: "Registration Open",
      totalTime: "Total Time",
      netPlayTime: "Net Play Time",
      possibleRounds: "Possible Rounds",
      min: "Min",
      quickTemplates: "Quick Start Templates",
      selectTemplate: "Select a template for a quick start",
      training: "Training",
      tournament: "Tournament", 
      league: "League",
      social: "Social",
      trainingDesc: "2h, 8-12 players",
      tournamentDesc: "4h, 16-24 players",
      leagueDesc: "Full day event",
      socialDesc: "3h, flexible",
      advancedSettings: "Show advanced settings",
      guaranteeGames: "Guarantee minimum games",
      minGamesPerPlayer: "Minimum games per player",
      guaranteeTime: "Guarantee minimum play time",
      minPlayTime: "Minimum play time (minutes)",
      warning: "Warning",
      guaranteeWarning: "With {players} players, the selected guarantees cannot be met!",
      recommendedMax: "Recommended maximum players",
      proceedAnyway: "Proceed anyway?",
      atLeast4Players: "At least 4 players required",
      saveChanges: "Save Changes",
      pauseName: "Break name",
      coffeBreak: "Coffee & Cake",
      lunchBreak: "Lunch Break",
      steps: {
        basics: "Basics",
        timeLocation: "Time & Location",
        playMode: "Play Mode",
        players: "Players",
        details: "Details"
      },
      americano: "Americano",
      americanoDesc: "Tournament with changing partners",
      selectSportTooltip: "Select the sport for your event",
      americanoTooltip: "Americano: Everyone plays with changing partners against changing opponents",
      courtsTooltip: "How many courts are available at the same time?",
      roundDurationTooltip: "How long does a game round last? Usually 10-20 minutes",
      time: "Time",
      eventDescriptionPlaceholder: "Additional information for participants...",
      tournamentTooltip: "Classic tournament format",
      leagueTooltip: "League match day format",
      socialTooltip: "Casual social event"
    },
    validation: {
      nameRequired: "Name is required",
      dateRequired: "Date is required",
      timeRequired: "Time is required",
      courtsRequired: "Courts are required",
      minPlayers: "At least 4 players required"
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
      save: "Guardar",
      cancel: "Cancelar",
      delete: "Eliminar",
      edit: "Editar",
      next: "Siguiente"
    },
    event: {
      new: "Nuevo Evento",
      create: "Crear Evento",
      myEvents: "Mis Eventos",
      title: "Nombre del Evento",
      sport: "Deporte",
      date: "Fecha",
      startTime: "Hora de inicio",
      endTime: "Hora de fin",
      location: "Ubicación",
      courts: "Número de pistas",
      maxPlayers: "Máx. jugadores",
      share: "Compartir Evento",
      startTournament: "Iniciar Torneo",
      status: {
        upcoming: "Próximo",
        running: "En curso",
        completed: "Completado",
        today: "Hoy",
        past: "Pasado"
      },
      noEvents: "No hay eventos disponibles"
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
      name: "Nombre",
      gender: "Género",
      male: "Masculino",
      female: "Femenino",
      skillLevel: "Nivel",
      fromDatabase: "Desde Base de Datos",
      managePlayer: "Gestionar jugadores",
      noPlayers: "No hay jugadores disponibles",
      level: "Nivel"
    },
    messages: {
      confirmDelete: "¿Estás seguro de que quieres eliminar este evento?",
      tournamentComplete: "¡Torneo completado!"
    },
    tournament: {
      round: "Ronda",
      match: "Partido",
      court: "Pista",
      points: "Puntos",
      games: "Juegos",
      score: "Resultado",
      winner: "Ganador",
      standings: "Clasificación",
      nextMatch: "Próximo Partido",
      currentMatch: "Partido Actual",
      completedMatches: "Partidos Completados",
      upcomingMatches: "Próximos Partidos"
    },
    playerManagement: {
      manage: "Gestionar Jugadores",
      enterName: "Introducir nombre del jugador...",
      fromDatabase: "Desde Base de Datos",
      detailsFor: "Detalles para",
      skillLevel: "Nivel de Habilidad",
      addPlayer: "Añadir Jugador",
      noPlayersYet: "Aún no se han añadido jugadores",
      eventFull: "El evento está lleno. Elimina jugadores para añadir nuevos.",
      menOnly: "Solo hombres",
      womenOnly: "Solo mujeres",
      menEventNote: "Nota: Este es un evento masculino",
      womenEventNote: "Nota: Este es un evento femenino",
      beginner: "Principiante",
      advanced: "Avanzado",
      good: "Bueno",
      veryGood: "Muy Bueno",
      expert: "Experto",
      beginnerLong: "Principiante",
      advancedBeginner: "Principiante Avanzado",
      lowerIntermediate: "Intermedio Bajo",
      goodIntermediate: "Intermedio Bueno",
      upperIntermediate: "Intermedio Alto",
      advancedPro: "Avanzado/Pro"
    },
    form: {
      editEvent: "Editar Evento",
      createEvent: "Crear Nuevo Evento",
      eventBasics: "Información Básica",
      eventName: "Nombre del Evento",
      required: "Requerido",
      sport: "Deporte",
      eventType: "Tipo de Evento",
      genderMode: "Modo de Género",
      mixed: "Mixto / Abierto",
      menOnly: "Solo Hombres",
      womenOnly: "Solo Mujeres",
      when: "¿Cuándo se realizará el evento?",
      date: "Fecha",
      startTime: "Hora de Inicio",
      endTime: "Hora de Fin",
      numberOfCourts: "Número de Pistas",
      location: "Ubicación",
      contactPhone: "Teléfono de Contacto",
      howToPlay: "¿Cómo jugar?",
      roundDuration: "Duración de Ronda (Minutos)",
      playMode: "Seleccionar Modo de Juego",
      relaxed: "Relajado",
      relaxedDesc: "Muchas pausas entre juegos, ideal para eventos sociales",
      balanced: "Equilibrado",
      balancedDesc: "Mín. 3 juegos garantizados, buen equilibrio",
      intensive: "Intensivo",
      intensiveDesc: "Máximo tiempo de juego para todos los participantes",
      breaks: "Planificar Pausas",
      addBreak: "Añadir Pausa",
      maxPlayers: "Establecer Máximo de Jugadores",
      recommendations: "Recomendaciones Inteligentes para tu Evento",
      optimal: "Óptimo",
      optimalDesc: "Todos juegan regularmente sin pausas largas",
      maximum: "Máximo",
      withGuarantees: "Con garantías seleccionadas",
      adopt: "Aplicar",
      preview: "Vista previa con",
      gamesPerPerson: "Juegos por Persona",
      playTimePerPerson: "Tiempo de Juego por Persona",
      breakTime: "Tiempo de Pausa",
      utilization: "Utilización",
      additionalInfo: "Información Adicional (opcional)",
      eventDescription: "Descripción del Evento",
      visibility: "Visibilidad y Registro",
      makePublic: "Hacer evento público",
      publicDesc: "Otros usuarios pueden encontrar y ver el evento",
      enableRegistration: "Habilitar registro online",
      registrationDesc: "Los jugadores pueden registrarse por sí mismos",
      registrationDeadline: "Fecha Límite de Registro",
      entryFee: "Cuota de Inscripción (€)",
      summary: "Resumen del Evento",
      noName: "Sin Nombre",
      noDate: "Sin Fecha",
      notSpecified: "No Especificado",
      public: "Público",
      private: "Privado",
      registrationOpen: "Registro Abierto",
      totalTime: "Tiempo Total",
      netPlayTime: "Tiempo Neto de Juego",
      possibleRounds: "Rondas Posibles",
      min: "Min",
      quickTemplates: "Plantillas de Inicio Rápido",
      selectTemplate: "Selecciona una plantilla para un inicio rápido",
      training: "Entrenamiento",
      tournament: "Torneo",
      league: "Liga", 
      social: "Social",
      trainingDesc: "2h, 8-12 jugadores",
      tournamentDesc: "4h, 16-24 jugadores",
      leagueDesc: "Evento de día completo",
      socialDesc: "3h, flexible",
      advancedSettings: "Mostrar configuración avanzada",
      guaranteeGames: "Garantizar juegos mínimos",
      minGamesPerPlayer: "Juegos mínimos por jugador",
      guaranteeTime: "Garantizar tiempo mínimo de juego",
      minPlayTime: "Tiempo mínimo de juego (minutos)",
      warning: "Advertencia",
      guaranteeWarning: "¡Con {players} jugadores, no se pueden cumplir las garantías seleccionadas!",
      recommendedMax: "Máximo recomendado de jugadores",
      proceedAnyway: "¿Continuar de todos modos?",
      atLeast4Players: "Se requieren al menos 4 jugadores",
      saveChanges: "Guardar Cambios",
      pauseName: "Nombre de la pausa",
      coffeBreak: "Café y Pastel",
      lunchBreak: "Pausa para Almorzar",
      steps: {
        basics: "Básicos",
        timeLocation: "Tiempo y Lugar",
        playMode: "Modo de Juego",
        players: "Jugadores",
        details: "Detalles"
      },
      americano: "Americano",
      americanoDesc: "Torneo con parejas cambiantes",
      selectSportTooltip: "Selecciona el deporte para tu evento",
      americanoTooltip: "Americano: Todos juegan con parejas cambiantes contra oponentes cambiantes",
      courtsTooltip: "¿Cuántas pistas están disponibles al mismo tiempo?",
      roundDurationTooltip: "¿Cuánto dura una ronda de juego? Normalmente 10-20 minutos",
      time: "Tiempo",
      eventDescriptionPlaceholder: "Información adicional para los participantes...",
      tournamentTooltip: "Formato de torneo clásico",
      leagueTooltip: "Formato de jornada de liga",
      socialTooltip: "Evento social casual"
    },
    validation: {
      nameRequired: "El nombre es requerido",
      dateRequired: "La fecha es requerida",
      timeRequired: "La hora es requerida",
      courtsRequired: "Las pistas son requeridas",
      minPlayers: "Se requieren al menos 4 jugadores"
    }
  }
}

// Language Context
const LanguageContext = createContext()

// Language Provider Component
export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('preferredLanguage') || 'de'
  })

  const changeLanguage = (newLang) => {
    setLanguage(newLang)
    localStorage.setItem('preferredLanguage', newLang)
  }

  const t = (key) => {
    // Wichtig: Konvertiere key zu String und prüfe ob es gültig ist
    const keyStr = String(key || '')
    
    if (!keyStr) {
      console.warn('Empty translation key provided')
      return ''
    }
    
    try {
      const keys = keyStr.split('.')
      let value = translations[language] || translations.de
      
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k]
        } else {
          // Fallback zu Deutsch
          let fallback = translations.de
          for (const fk of keys) {
            if (fallback && typeof fallback === 'object' && fk in fallback) {
              fallback = fallback[fk]
            } else {
              return keyStr
            }
          }
          return typeof fallback === 'string' ? fallback : keyStr
        }
      }
      
      return typeof value === 'string' ? value : keyStr
    } catch (error) {
      console.error('Translation error for key:', keyStr, error)
      return keyStr
    }
  }

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

// Hook to use translations
export const useTranslation = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    // Return a dummy context for development
    return {
      language: 'de',
      changeLanguage: () => {},
      t: (key) => key
    }
  }
  return context
}

// Language Selector Component
export const LanguageSelector = () => {
  const { language, changeLanguage } = useTranslation()
  const [showDropdown, setShowDropdown] = useState(false)
  
  const languages = [
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇪🇸' }
  ]
  
  const currentLanguage = languages.find(lang => lang.code === language) || languages[0]
  
  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Select language"
      >
        <Globe className="w-5 h-5 text-gray-600" />
        <span className="text-2xl">{currentLanguage.flag}</span>
        <span className="hidden sm:inline text-sm font-medium">{currentLanguage.name}</span>
      </button>
      
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                changeLanguage(lang.code)
                setShowDropdown(false)
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors
                ${language === lang.code ? 'bg-blue-50 text-blue-600' : ''}
                ${lang.code === 'de' ? 'rounded-t-lg' : ''}
                ${lang.code === 'es' ? 'rounded-b-lg' : ''}
              `}
            >
              <span className="text-2xl">{lang.flag}</span>
              <span className="font-medium">{lang.name}</span>
              {language === lang.code && (
                <span className="ml-auto text-blue-600">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}