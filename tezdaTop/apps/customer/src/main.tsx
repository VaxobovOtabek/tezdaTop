import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import { CustomerApp } from './App';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CustomerApp Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '32px', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
          <h2 style={{ fontSize: '20px', color: '#172C28', marginBottom: '8px' }}>
            Ilovani yuklashda xatolik yuz berdi
          </h2>
          <p style={{ color: '#566A63', fontSize: '14px', marginBottom: '16px' }}>
            {this.state.error?.message || 'Noma‘lum xatolik'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#116B50',
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Sahifani yangilash
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <CustomerApp />
    </ErrorBoundary>
  </React.StrictMode>
);
