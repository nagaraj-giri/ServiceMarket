
import React, { ErrorInfo, ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

console.log("DubaiLink: Starting Application Initialization...");

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary class component to catch runtime errors.
 * Fixed 'props' and 'state' access errors by explicitly extending React.Component 
 * and using class property initializers/declarations to ensure type visibility in strict environments.
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Explicitly declaring props and state as class properties to ensure they are recognized by the TypeScript compiler
  // This resolves the "Property 'props' does not exist" and "Property 'state' does not exist" errors in strict environments.
  public props: ErrorBoundaryProps;
  public state: ErrorBoundaryState = { hasError: false, error: null };

  constructor(props: ErrorBoundaryProps) {
    super(props);
    // Initializing props in the constructor for maximum compatibility with strict type checking
    this.props = props;
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Critical Runtime Error Captured by Boundary:", error, errorInfo);
  }

  render() {
    // Correctly accessing state inherited from React.Component
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
          <div className="bg-white p-10 rounded-2xl shadow-2xl max-w-md w-full text-center border border-red-100 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Application Halted</h1>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              A dependency conflict was detected. This usually occurs when the browser cache contains incompatible library versions.
            </p>
            <div className="space-y-3">
              <button 
                onClick={() => window.location.reload()}
                className="w-full bg-dubai-dark text-white py-3.5 rounded-xl font-bold hover:bg-black transition-all shadow-lg active:scale-[0.98]"
              >
                Reload Application
              </button>
              <button 
                onClick={() => {
                   if ('serviceWorker' in navigator) {
                      navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
                   }
                   window.location.reload();
                }}
                className="w-full bg-white border border-gray-200 text-gray-600 py-3 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors"
              >
                Clear Cache & Hard Reload
              </button>
            </div>
            {this.state.error && (
              <div className="mt-8 pt-4 border-t border-gray-100">
                <p className="text-[10px] font-mono text-gray-400 break-all bg-gray-50 p-2 rounded text-left overflow-x-auto">
                  {this.state.error.name}: {this.state.error.message}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }
    // Correctly accessing props inherited from React.Component through proper class extension and declaration
    return this.props.children;
  }
}

const rootElement = document.getElementById("root");
if (rootElement) {
  try {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ErrorBoundary>
      </React.StrictMode>
    );
    console.log("DubaiLink: Virtual DOM Mounted Successfully.");
  } catch (err) {
    console.error("Mounting Error:", err);
    rootElement.innerHTML = `
      <div style="height: 100vh; display: flex; align-items: center; justify-center; font-family: sans-serif; background: #f8fafc; padding: 20px;">
        <div style="background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: center; max-width: 400px; margin: auto;">
          <h1 style="color: #1A1A1A; margin-bottom: 10px;">Initialization Error</h1>
          <p style="color: #666; font-size: 14px; margin-bottom: 20px;">${err}</p>
          <button onclick="location.reload()" style="background: #C5A059; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; cursor: pointer;">Try Again</button>
        </div>
      </div>`;
  }
}
