import React from 'react';
import ReactDOM from 'react-dom/client';
import { LanguageProvider } from '@yaqintop/ui';
import { AdminApp } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <AdminApp />
    </LanguageProvider>
  </React.StrictMode>
);
