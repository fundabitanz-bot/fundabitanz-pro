import React, { ErrorInfo, ReactNode } from 'react';
import { RefreshCw, Activity } from 'lucide-react';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary component to catch rendering errors in the UI.
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console
    console.error("SGI GUARD - Error detectado:", error, errorInfo);
  }

  public render(): ReactNode {
    // FIX: Using explicit casting for this to bypass property existence checks on class component instance
    const { children } = (this as any).props;
    const { hasError, error } = (this as any).state;

    if (hasError) {
      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-[40px] shadow-2xl border border-slate-200 overflow-hidden text-center">
            <div className="bg-[#003399] p-8 flex flex-col items-center">
                <Activity size={48} className="text-white mb-4" />
                <h2 className="text-xl font-black text-white uppercase">Error de Interfaz</h2>
            </div>
            <div className="p-8 space-y-6">
                <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100">
                    <p className="text-[10px] text-rose-800 font-mono break-words">
                        {error?.message || 'Error desconocido'}
                    </p>
                </div>
                <button onClick={() => window.location.reload()} className="w-full bg-[#003399] text-white py-4 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2">
                    <RefreshCw size={18} /> Reiniciar Sistema
                </button>
            </div>
          </div>
        </div>
      );
    }
    
    return children;
  }
}

export default ErrorBoundary;