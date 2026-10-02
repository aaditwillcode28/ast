import React, { Component } from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public declare props: ErrorBoundaryProps;
  public state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const msg = error instanceof Error ? error.message : String(error);
    return { hasError: true, errorMessage: msg };
  }

  public componentDidCatch(error: unknown, errorInfo: unknown): void {
    console.error('KataTira App Render Error:', error, errorInfo);
  }

  private handleReset = (): void => {
    try {
      localStorage.clear();
    } catch (e) {}
    window.location.reload();
  };

  public render(): React.ReactNode {
    const { hasError, errorMessage } = this.state;

    if (hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
            <div className="h-14 w-14 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center mx-auto text-2xl font-black">
              KT
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">KataTira encountered a problem</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                A temporary error occurred while rendering the page.
              </p>
            </div>

            {errorMessage && (
              <div className="bg-slate-950 p-3 rounded-xl text-left border border-slate-700/60 overflow-x-auto text-[11px] font-mono text-rose-300">
                {errorMessage}
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Reload Page
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full py-2 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Reset App & Storage
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
