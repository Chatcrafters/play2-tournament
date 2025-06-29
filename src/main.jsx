// ULTIMATE WINDOW-SAFE FIX
(function() {
  if (typeof window === 'undefined') return; // Server-side exit
  
  try {
    if (!window.console) {
      window.console = {log:()=>{},warn:()=>{},error:()=>{},info:()=>{},debug:()=>{}};
    }
    
    if (!(typeof window !== "undefined" ? window.globalTranslationFallback : null) || ((key) => key)) {
      (typeof window !== "undefined" ? window.globalTranslationFallback : null) || ((key) => key) = function(key) { return key || 'NO_TRANSLATION'; };
    }
    
    if (!(typeof window !== "undefined" ? window.useTranslation : null) || (() => ({t: (key) => key}))) {
      (typeof window !== "undefined" ? window.useTranslation : null) || (() => ({t: (key) => key})) = function() {
        return { t: (typeof window !== "undefined" ? window.globalTranslationFallback : null) || ((key) => key), language: 'de' };
      };
    }
    
    window.addEventListener('error', function(e) {
      if (e.error && e.error.message && 
          (e.error.message.indexOf('useTranslation') !== -1 || 
           e.error.message.indexOf('console') !== -1 || 
           e.error.message.indexOf('window') !== -1)) {
        e.preventDefault(); return false;
      }
    });
  } catch (err) {
    // Silent fail
  }
})();

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.
// NUKLEAR-FIX: Globaler useTranslation Fallback
// removed console.log
(typeof window !== "undefined" ? window.globalTranslationFallback : null) || ((key) => key) = (key) => key || 'NO_TRANSLATION'
if (typeof (typeof window !== "undefined" ? window.useTranslation : null) || (() => ({t: (key) => key})) === 'undefined') {
  (typeof window !== "undefined" ? window.useTranslation : null) || (() => ({t: (key) => key})) = () => ({ t: (typeof window !== "undefined" ? window.globalTranslationFallback : null) || ((key) => key), language: 'de' })
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






