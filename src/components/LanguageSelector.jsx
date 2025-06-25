import React, { createContext, useContext, useState, useEffect } from 'react'
import { Globe } from 'lucide-react'

// Übersetzungen direkt in der Komponente
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
      edit: "Bearbeiten"
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
      startTournament: "Turnier starten"
    },
    player: {
      players: "Spieler",
      addPlayer: "Spieler hinzufügen",
      name: "Name",
      gender: "Geschlecht",
      male: "Männlich", 
      female: "Weiblich",
      skillLevel: "Spielstärke"
    },
    messages: {
      confirmDelete: "Möchten Sie dieses Event wirklich löschen?"
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
      edit: "Edit"
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
      startTournament: "Start Tournament"
    },
    player: {
      players: "Players",
      addPlayer: "Add Player",
      name: "Name",
      gender: "Gender",
      male: "Male",
      female: "Female",
      skillLevel: "Skill Level"
    },
    messages: {
      confirmDelete: "Are you sure you want to delete this event?"
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
      edit: "Editar"
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
      startTournament: "Iniciar Torneo"
    },
    player: {
      players: "Jugadores",
      addPlayer: "Añadir Jugador",
      name: "Nombre",
      gender: "Género",
      male: "Masculino",
      female: "Femenino",
      skillLevel: "Nivel"
    },
    messages: {
      confirmDelete: "¿Estás seguro de que quieres eliminar este evento?"
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
    const keys = key.split('.')
    let value = translations[language]
    
    for (const k of keys) {
      value = value?.[k]
    }
    
    return value || key
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
    throw new Error('useTranslation must be used within a LanguageProvider')
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
