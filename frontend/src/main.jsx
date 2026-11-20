import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/figtree';
import './index.css';
import { wakeServer } from './services/api';

wakeServer();

// Necesario para los recordatorios push (no cachea nada: no cambia cómo se carga la app)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
