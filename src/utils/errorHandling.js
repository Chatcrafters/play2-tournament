// src/utils/errorHandling.js
import { supabase } from '../lib/supabase'

// Error Types
export const ERROR_TYPES = {
  NETWORK: 'NETWORK',
  AUTH: 'AUTH',
  VALIDATION: 'VALIDATION',
  DATABASE: 'DATABASE',
  UNKNOWN: 'UNKNOWN'
}

// Error Classification
export const classifyError = (error) => {
  if (!error) return ERROR_TYPES.UNKNOWN

  // Network Errors
  if (error.message?.includes('Failed to fetch') || 
      error.message?.includes('NetworkError') ||
      error.code === 'NETWORK_ERROR') {
    return ERROR_TYPES.NETWORK
  }

  // Supabase Auth Errors
  if (error.message?.includes('Invalid login credentials') ||
      error.message?.includes('Email not confirmed') ||
      error.message?.includes('User not found') ||
      error.status === 401) {
    return ERROR_TYPES.AUTH
  }

  // Supabase Database Errors
  if (error.code?.startsWith('PGRST') ||
      error.details ||
      error.hint) {
    return ERROR_TYPES.DATABASE
  }

  // Validation Errors
  if (error.message?.includes('required') ||
      error.message?.includes('invalid') ||
      error.message?.includes('validation')) {
    return ERROR_TYPES.VALIDATION
  }

  return ERROR_TYPES.UNKNOWN
}

// User-friendly Error Messages
export const getErrorMessage = (error, t) => {
  const errorType = classifyError(error)
  
  switch (errorType) {
    case ERROR_TYPES.NETWORK:
      return {
        title: t('errors.network.title') || 'Verbindungsfehler',
        message: t('errors.network.message') || 'Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.',
        action: t('errors.network.action') || 'Erneut versuchen'
      }
    
    case ERROR_TYPES.AUTH:
      return {
        title: t('errors.auth.title') || 'Anmeldung fehlgeschlagen',
        message: t('errors.auth.message') || 'Ihre Anmeldedaten sind ungültig oder abgelaufen.',
        action: t('errors.auth.action') || 'Erneut anmelden'
      }
    
    case ERROR_TYPES.DATABASE:
      return {
        title: t('errors.database.title') || 'Speicherfehler',
        message: t('errors.database.message') || 'Die Daten konnten nicht gespeichert werden. Versuchen Sie es erneut.',
        action: t('errors.database.action') || 'Erneut versuchen'
      }
    
    case ERROR_TYPES.VALIDATION:
      return {
        title: t('errors.validation.title') || 'Eingabefehler',
        message: error.message || (t('errors.validation.message') || 'Bitte überprüfen Sie Ihre Eingaben.'),
        action: t('errors.validation.action') || 'Korrigieren'
      }
    
    default:
      return {
        title: t('errors.unknown.title') || 'Unbekannter Fehler',
        message: t('errors.unknown.message') || 'Ein unerwarteter Fehler ist aufgetreten.',
        action: t('errors.unknown.action') || 'Erneut versuchen'
      }
  }
}

// Async Operation Wrapper with Error Handling
export const withErrorHandling = async (operation, toast, t, options = {}) => {
  const {
    loadingMessage = null,
    successMessage = null,
    showErrorToast = true,
    retries = 0,
    retryDelay = 1000
  } = options

  let loadingToastId = null
  
  try {
    // Show loading toast if specified
    if (loadingMessage && toast) {
      loadingToastId = toast.showInfo(loadingMessage, 0) // 0 = don't auto-remove
    }

    // Execute operation with retries
    let lastError = null
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await operation()
        
        // Remove loading toast
        if (loadingToastId && toast) {
          toast.removeToast(loadingToastId)
        }
        
        // Show success message
        if (successMessage && toast) {
          toast.showSuccess(successMessage)
        }
        
        return { success: true, data: result, error: null }
        
      } catch (error) {
        lastError = error
        
        // If not the last attempt, wait before retry
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay))
          continue
        }
        
        // This was the last attempt, break to error handling
        break
      }
    }
    
    throw lastError
    
  } catch (error) {
    // Remove loading toast
    if (loadingToastId && toast) {
      toast.removeToast(loadingToastId)
    }
    
    console.error('Operation failed:', error)
    
    // Show error toast if enabled
    if (showErrorToast && toast) {
      const errorInfo = getErrorMessage(error, t)
      toast.showError(`${errorInfo.title}: ${errorInfo.message}`)
    }
    
    return { success: false, data: null, error }
  }
}

// Network Status Detection
export const createNetworkStatusHandler = (toast, t) => {
  let isOnline = navigator.onLine
  let hasShownOfflineMessage = false
  
  const handleOnline = () => {
    if (!isOnline) {
      isOnline = true
      hasShownOfflineMessage = false
      if (toast) {
        toast.showSuccess(t('network.backOnline') || 'Verbindung wiederhergestellt')
      }
    }
  }
  
  const handleOffline = () => {
    if (isOnline) {
      isOnline = false
      if (toast && !hasShownOfflineMessage) {
        toast.showWarning(
          t('network.offline') || 'Keine Internetverbindung. Die App arbeitet im Offline-Modus.',
          10000
        )
        hasShownOfflineMessage = true
      }
    }
  }
  
  // Add event listeners
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  
  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}

// Supabase Error Helper
export const handleSupabaseError = (error, operation = 'operation', toast, t) => {
  console.error(`Supabase ${operation} error:`, error)
  
  if (!toast || !t) {
    return false
  }
  
  const errorInfo = getErrorMessage(error, t)
  toast.showError(`${errorInfo.title}: ${errorInfo.message}`)
  
  return true
}

// Form Validation Helper
export const validateField = (value, rules = {}, fieldName = 'Field') => {
  const errors = []
  
  // Required validation
  if (rules.required && (!value || value.toString().trim() === '')) {
    errors.push(`${fieldName} ist erforderlich`)
  }
  
  // Only validate further if value exists
  if (!value) return errors
  
  const stringValue = value.toString()
  
  // Min length validation
  if (rules.minLength && stringValue.length < rules.minLength) {
    errors.push(`${fieldName} muss mindestens ${rules.minLength} Zeichen lang sein`)
  }
  
  // Max length validation
  if (rules.maxLength && stringValue.length > rules.maxLength) {
    errors.push(`${fieldName} darf maximal ${rules.maxLength} Zeichen lang sein`)
  }
  
  // Email validation
  if (rules.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stringValue)) {
    errors.push(`${fieldName} muss eine gültige E-Mail-Adresse sein`)
  }
  
  // Number validation
  if (rules.number && isNaN(Number(stringValue))) {
    errors.push(`${fieldName} muss eine Zahl sein`)
  }
  
  // Min value validation
  if (rules.min && Number(stringValue) < rules.min) {
    errors.push(`${fieldName} muss mindestens ${rules.min} sein`)
  }
  
  // Max value validation
  if (rules.max && Number(stringValue) > rules.max) {
    errors.push(`${fieldName} darf maximal ${rules.max} sein`)
  }
  
  // Custom pattern validation
  if (rules.pattern && !rules.pattern.test(stringValue)) {
    errors.push(rules.patternMessage || `${fieldName} hat ein ungültiges Format`)
  }
  
  return errors
}

// Batch Validation Helper
export const validateForm = (data, validationRules) => {
  const errors = {}
  let isValid = true
  
  Object.keys(validationRules).forEach(fieldName => {
    const fieldErrors = validateField(
      data[fieldName], 
      validationRules[fieldName], 
      fieldName
    )
    
    if (fieldErrors.length > 0) {
      errors[fieldName] = fieldErrors
      isValid = false
    }
  })
  
  return { isValid, errors }
}