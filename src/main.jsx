// ============ SAFE WINDOW GUARDS ============
if (typeof window !== "undefined") {
  window.console = window.console || {
    log: function() {},
    warn: function() {},
    error: function() {}
  };
  
  window.globalTranslationFallback = function(key) {
    return key || "NO_TRANSLATION";
  };
  
  window.useTranslation = function() {
    return {
      t: window.globalTranslationFallback,
      language: "de"
    };
  };
}

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
