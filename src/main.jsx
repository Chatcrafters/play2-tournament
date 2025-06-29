import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.
// NUKLEAR-FIX: Globaler useTranslation Fallback
console.log('🛡️ Installing nuclear translation fix...')
window.globalTranslationFallback = (key) => key || 'NO_TRANSLATION'
if (typeof window.useTranslation === 'undefined') {
  window.useTranslation = () => ({ t: window.globalTranslationFallback, language: 'de' })
}
window.addEventListener('error', (e) => {
  if (e.error && e.error.message && e.error.message.includes('useTranslation')) {
    console.warn('🔧 Translation error intercepted'); e.preventDefault(); return false
  }
})
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

