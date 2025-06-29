// src/components/LanguageSelector.jsx
import React, { createContext, useContext, useState } from 'react'
import { Globe } from 'lucide-react'
// WICHTIG: Importiere die vollständigen Übersetzungen aus translations.js
import { translations } from '../utils/translations'

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
      // removed console.warn
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
              // removed console.warn
              return keyStr
            }
          }
          return typeof fallback === 'string' ? fallback : keyStr
        }
      }
      
      return typeof value === 'string' ? value : keyStr
    } catch (error) {
      // removed console.error
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

