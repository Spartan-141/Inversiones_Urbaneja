import React from 'react'
if (window.api) window.api.invoke('log', '--- MAIN.JSX IS EXECUTING ---');
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

window.onerror = function(message, source, lineno, colno, error) {
  if (window.api && window.api.invoke) {
    window.api.invoke('log', `Error: ${message}\n  at ${source}:${lineno}:${colno}\n  ${error?.stack || ''}`);
  }
};
window.addEventListener('unhandledrejection', event => {
  if (window.api && window.api.invoke) {
    window.api.invoke('log', `Unhandled Promise Rejection: ${event.reason}`);
  }
});

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
