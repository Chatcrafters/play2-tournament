// src/components/Toast.jsx
import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { useTranslation } from './LanguageSelector'

// Toast Context
const ToastContext = createContext()

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Toast Provider Component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random()
    const toast = { id, message, type, duration }
    
    setToasts(prev => [...prev, toast])
    
    // Auto-remove toast after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
    
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const removeAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  // Convenience methods
  const showSuccess = useCallback((message, duration) => {
    return addToast(message, 'success', duration)
  }, [addToast])

  const showError = useCallback((message, duration = 8000) => {
    return addToast(message, 'error', duration)
  }, [addToast])

  const showWarning = useCallback((message, duration) => {
    return addToast(message, 'warning', duration)
  }, [addToast])

  const showInfo = useCallback((message, duration) => {
    return addToast(message, 'info', duration)
  }, [addToast])

  const value = {
    toasts,
    addToast,
    removeToast,
    removeAllToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

// Toast Container Component
const ToastContainer = () => {
  const { toasts } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}

// Individual Toast Item
const ToastItem = ({ toast }) => {
  const { removeToast } = useToast()
  const { t } = useTranslation()

  const getToastStyles = (type) => {
    const baseStyles = "flex items-start gap-3 p-4 rounded-lg shadow-lg border-l-4 bg-white animate-in slide-in-from-right-full duration-300"
    
    switch (type) {
      case 'success':
        return `${baseStyles} border-l-green-500 text-green-800`
      case 'error':
        return `${baseStyles} border-l-red-500 text-red-800`
      case 'warning':
        return `${baseStyles} border-l-yellow-500 text-yellow-800`
      case 'info':
      default:
        return `${baseStyles} border-l-blue-500 text-blue-800`
    }
  }

  const getIcon = (type) => {
    const iconProps = { className: "w-5 h-5 flex-shrink-0 mt-0.5" }
    
    switch (type) {
      case 'success':
        return <CheckCircle {...iconProps} className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-600" />
      case 'error':
        return <XCircle {...iconProps} className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
      case 'warning':
        return <AlertCircle {...iconProps} className="w-5 h-5 flex-shrink-0 mt-0.5 text-yellow-600" />
      case 'info':
      default:
        return <Info {...iconProps} className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600" />
    }
  }

  return (
    <div className={getToastStyles(toast.type)}>
      {getIcon(toast.type)}
      <div className="flex-1">
        <p className="text-sm font-medium leading-relaxed">
          {toast.message}
        </p>
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label={t('navigation.close')}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// Error Boundary Component
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo)
    
    // Optional: Send error to monitoring service
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Oops! Etwas ist schiefgelaufen
            </h2>
            <p className="text-gray-600 mb-6">
              Die Anwendung ist auf einen unerwarteten Fehler gestoßen. 
              Bitte laden Sie die Seite neu oder versuchen Sie es später erneut.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Seite neu laden
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Erneut versuchen
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">
                  Technische Details (Development)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                  {this.state.error?.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}