
// SUPER SAFE CONSOLE OVERRIDE - ALLERERSTE ZEILE
(function() {
  const safeConsole = {
    log: () => {}, warn: () => {}, error: () => {}, info: () => {}, debug: () => {}
  };
  if (typeof window !== 'undefined') window.console = safeConsole;
  if (typeof global !== 'undefined') global.console = safeConsole;
  window.globalTranslationFallback = (key) => key || 'NO_TRANSLATION';
  if (!window.useTranslation) {
    window.useTranslation = () => ({ t: window.globalTranslationFallback, language: 'de' });
  }
})();
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.
// NUKLEAR-FIX: Globaler useTranslation Fallback
// removed console.log
window.globalTranslationFallback = (key) => key || 'NO_TRANSLATION'
if (typeof window.useTranslation === 'undefined') {
  window.useTranslation = () => ({ t: window.globalTranslationFallback, language: 'de' })
}
window.addEventListener('error', (e) => {
  if (e.error && e.error.message && e.error.message.includes('useTranslation')) {
    // removed console.warn; e.preventDefault(); return false
  }
})
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)




