import * as React from 'react';
import { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ServerCrash } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Robust Error Boundary
 * Uses traditional constructor and lifecycle methods for maximum environment compatibility.
 */
// Fix: Explicitly ensuring the class extends React.Component with proper generic types to facilitate recognition of inherited members.
export class ErrorBoundary extends React.Component<Props, State> {
  // Fix: Explicitly declaring state as a class property to satisfy TypeScript compiler when inheritance members aren't automatically picked up.
  public state: State = {
    hasError: false,
    error: null
  };

  constructor(props: Props) {
    super(props);
    // Removed redundant `this.state` initialization here,
    // relying on the class property `state` initialization above.
    // this.state = {
    //   hasError: false,
    //   error: null
    // };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[System Fault] Uncaught rendering error:', error, errorInfo);
  }

  private handleReset = () => {
    window.location.reload();
  };

  render() {
    // Fix: Accessing state using 'this' as expected in a class component, inherited from Component<Props, State>.
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center font-sans">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-lg w-full border border-slate-100 ring-1 ring-slate-200">
            <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <ServerCrash size={40} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-3 tracking-tighter uppercase">Circuit Breaker Active</h1>
            <p className="text-slate-500 mb-8 text-sm leading-relaxed font-medium">
              We've encountered a runtime exception. The system has automatically isolated the fault to protect your data integrity.
            </p>
            
            {/* Fix: Verifying 'error' exists in state before attempting to render its content. */}
            {this.state.error && (
                <div className="bg-slate-900 p-4 rounded-3xl font-mono text-emerald-400 text-left mb-8 overflow-auto max-h-40 text-[10px] shadow-inner">
                    <span className="text-rose-400 font-bold uppercase mr-2">[Error Stack]</span>
                    {/* Fix: Safely accessing the error object and converting it to string for display. */}
                    {this.state.error.toString()}
                </div>
            )}
            
            <button
              onClick={this.handleReset}
              className="w-full bg-brand-600 text-white py-4 rounded-full font-black uppercase tracking-widest hover:bg-brand-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-brand-200"
            >
              <RefreshCw size={20} /> Restart Application Engine
            </button>
          </div>
        </div>
      );
    }

    // Fix: Correctly accessing children via 'this.props', as defined by the Component generic.
    return this.props.children;
  }
}