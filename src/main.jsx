import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './app/App.jsx';
import { getFirebaseApp } from './services/firebaseApp.js';
import { initializeFirebaseAppCheck } from './services/firebaseAppCheck.js';
import './styles/tokens.css';
import './styles/fonts.css';
import './styles/base.css';
import './styles/components.css';
import './styles/pages.css';

// Configured cloud builds initialize App Check. Analytics remains opt-in.
getFirebaseApp();
void initializeFirebaseAppCheck().catch(() => console.warn('App verification is unavailable. Ordering opens soon.'));

createRoot(document.getElementById('root')).render(
  <React.StrictMode><BrowserRouter><App /></BrowserRouter></React.StrictMode>,
);
