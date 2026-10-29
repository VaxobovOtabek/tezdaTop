import React from 'react';
import ReactDOM from 'react-dom/client';
import { LanguageProvider } from '@yaqintop/ui';
import { LandingApp } from './App';
import { initAnalytics } from './utils/analytics';
import './index.css';

// Initialize Google Analytics for Landing Page
initAnalytics();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <LanguageProvider>
      <LandingApp />
    </LanguageProvider>
  </React.StrictMode>
);
