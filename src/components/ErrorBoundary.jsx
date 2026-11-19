import React from 'react';
import { AlertCircle, RefreshCw, Home, User, Stethoscope } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('VirtuHeal UI caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleResetState = (targetRole = 'landing') => {
    try {
      if (targetRole === 'landing') {
        sessionStorage.removeItem('virtuheal_auth_role');
        sessionStorage.removeItem('virtuheal_current_view');
      } else {
        sessionStorage.setItem('virtuheal_auth_role', targetRole);
        sessionStorage.setItem('virtuheal_current_view', targetRole === 'doctor' ? 'dashboard' : 'portal');
      }
    } catch { }
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#faf8f2] flex items-center justify-center p-6 text-slate-800 font-sans">
          <div className="max-w-xl w-full bg-white/90 backdrop-blur-xl border border-sky-900/15 rounded-3xl p-8 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
              <AlertCircle size={32} />
            </div>

            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                VirtuHeal Clinical Interface Recovery
              </h1>
              <p className="text-sm text-slate-600 mt-2">
                A component encountered a rendering issue. You can instantly restore any clinical workspace below:
              </p>
            </div>

            {this.state.error?.message && (
              <div className="text-left bg-slate-900 text-slate-200 text-xs font-mono p-3.5 rounded-xl overflow-x-auto max-h-32 border border-slate-800">
                {this.state.error.message}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <button
                type="button"
                onClick={() => this.handleResetState('landing')}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Home size={14} className="text-slate-600" />
                <span>Home Page</span>
              </button>

              <button
                type="button"
                onClick={() => this.handleResetState('patient')}
                className="px-4 py-2.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-800 border border-sky-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <User size={14} className="text-sky-700" />
                <span>Patient Portal</span>
              </button>

              <button
                type="button"
                onClick={() => this.handleResetState('doctor')}
                className="px-4 py-2.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-800 border border-blue-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Stethoscope size={14} className="text-blue-700" />
                <span>Doctor Workspace</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => this.handleResetState('landing')}
              className="text-xs text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1.5 mx-auto font-medium"
            >
              <RefreshCw size={12} />
              <span>Hard Reset All Cached State</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

