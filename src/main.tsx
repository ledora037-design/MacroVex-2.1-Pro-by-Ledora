import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error?.message || 'Unknown error' };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // If it's a cross-origin iframe security error or React scheduler race, gracefully recover
    if (
      error.message?.includes('cross-origin') ||
      error.message?.includes('Blocked a frame') ||
      error.message?.includes('Should not already be working') ||
      error.message?.includes('SecurityError')
    ) {
      console.warn('[MacroVex 2.1 Pro Protected Boundary]: Handled cross-origin frame event.');
      this.setState({ hasError: false, errorMessage: '' });
      return;
    }
    console.error('[MacroVex 2.1 Pro Root Error]:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.errorMessage) {
      return (
        <div className="min-h-screen bg-[#090B0D] text-[#F4F6F8] flex flex-col items-center justify-center p-6 text-center font-mono">
          <div className="p-6 rounded-lg border border-red-500/30 bg-[#12161E] max-w-md shadow-2xl">
            <h2 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-2">
              TERMINAL WORKSPACE RECOVERY
            </h2>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              {this.state.errorMessage}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, errorMessage: '' });
                window.location.reload();
              }}
              className="px-5 py-2.5 bg-[#20C7B7] hover:bg-[#1db3a4] text-black font-bold text-xs rounded transition-all cursor-pointer uppercase tracking-wider"
            >
              RESTART WORKSPACE
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);

