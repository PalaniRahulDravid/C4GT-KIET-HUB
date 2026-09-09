import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { useAuth, getDashboardPath, isStudentProfileComplete } from '../context/AuthContext';

export default function Login() {
  const { user, isAuthenticated, loginWithGoogle, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const googleBtnRef = useRef(null);
  const isInitializedRef = useRef(false);

  const DEFAULT_GOOGLE_CLIENT_ID = '37964450681-qjr64dq42neav1q5jbpbeo0pcgtgpfi0.apps.googleusercontent.com';
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID;

  // Synchronously prevent authenticated users from viewing or accessing the login page
  if (!loading && isAuthenticated && user) {
    if (!isStudentProfileComplete(user) && user.role !== 'admin') {
      return <Navigate to="/complete-profile" replace />;
    }
    const targetPath = location.state?.from?.pathname || getDashboardPath(user.role);
    return <Navigate to={targetPath} replace />;
  }

  // Initialize official Google Identity Services (GIS) button
  useEffect(() => {
    if (typeof window === 'undefined' || !googleClientId) return;
    if (isInitializedRef.current) return;

    const initializeGoogle = () => {
      if (isInitializedRef.current) return;
      if (window.google?.accounts?.id && googleBtnRef.current) {
        try {
          isInitializedRef.current = true;
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: async (response) => {
              if (response.credential) {
                setSubmitting(true);
                setError(null);
                try {
                  const loggedInUser = await loginWithGoogle(response.credential);
                  if (!isStudentProfileComplete(loggedInUser) && loggedInUser.role !== 'admin') {
                    navigate('/complete-profile', { replace: true });
                  } else {
                    const dest = location.state?.from?.pathname || getDashboardPath(loggedInUser.role);
                    navigate(dest, { replace: true });
                  }
                } catch (err) {
                  setError(err.message || 'Google authentication failed');
                } finally {
                  setSubmitting(false);
                }
              }
            },
          });

          // Dynamic width to perfectly fit on all mobile & desktop screen sizes
          const currentWidth = googleBtnRef.current?.offsetWidth || 340;
          const calculatedWidth = Math.min(Math.max(currentWidth, 240), 380);

          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            shape: 'rectangular',
            text: 'continue_with',
            width: calculatedWidth,
          });
        } catch (err) {
          console.error('Google button render error:', err);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initializeGoogle();
    } else {
      const timer = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(timer);
          initializeGoogle();
        }
      }, 250);
      return () => clearInterval(timer);
    }
  }, [googleClientId, loginWithGoogle, navigate, location]);

  const handleCustomBtnClick = () => {
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt();
      } catch (e) {
        console.error('Google prompt trigger error:', e);
      }
    }
  };

  return (
    <div className="w-full min-h-screen lg:h-screen lg:max-h-screen lg:overflow-hidden flex flex-col lg:flex-row select-none bg-[#F8FAFC] font-sans">
      {/* ================= LEFT LOGIN PANEL (50%) ================= */}
      <div className="w-full lg:w-1/2 h-full min-h-screen lg:min-h-0 flex flex-col justify-between px-5 sm:px-10 lg:px-12 py-6 sm:py-8 lg:py-8 relative overflow-y-auto border-b lg:border-b-0 lg:border-r border-slate-200 bg-[#F8FAFC]">
        {/* Top Nav bar inside login panel */}
        <div className="flex justify-between items-center w-full max-w-[420px] mx-auto flex-shrink-0">
          <Link
            to="/"
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            Back to Landing Page
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>SSO Enabled</span>
          </div>
        </div>

        {/* Center Login Box */}
        <div className="w-full max-w-[400px] mx-auto my-auto py-6 sm:py-8 flex-shrink-0">
          <div className="mb-6 sm:mb-8 text-center">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-sm">
              <span className="material-symbols-outlined text-indigo-600 text-[24px] sm:text-[26px]">hub</span>
            </div>
            <h2 className="text-2xl sm:text-[28px] lg:text-3xl font-bold tracking-tight text-slate-900">
              Welcome to C4GT HUB
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 sm:mt-1.5">
              Sign in to continue to your engineering dashboard
            </p>
          </div>

          <div className="space-y-4 sm:space-y-5">
            {/* Custom Styled Google Sign-In Button with Layered Real GIS Trigger */}
            <div className="relative w-full max-w-[380px] mx-auto">
              <button
                type="button"
                onClick={handleCustomBtnClick}
                disabled={submitting}
                className="w-full h-[50px] sm:h-[52px] bg-white hover:bg-slate-50 active:scale-[0.99] border border-slate-200 text-slate-900 text-sm sm:text-[15px] font-semibold rounded-xl transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow-md cursor-pointer group focus:outline-none focus:ring-4 focus:ring-indigo-100 relative overflow-hidden"
              >
                {submitting ? (
                  <div className="flex items-center gap-2 text-indigo-600 font-medium text-xs sm:text-sm">
                    <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>Authenticating with Google...</span>
                  </div>
                ) : (
                  <>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-105 shrink-0" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      ></path>
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      ></path>
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        fill="#FBBC05"
                      ></path>
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        fill="#EA4335"
                      ></path>
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              {/* Invisible Google GIS rendered button layered over custom button */}
              <div
                ref={googleBtnRef}
                className="absolute inset-0 w-full h-full opacity-0 overflow-hidden cursor-pointer z-10 pointer-events-auto flex items-center justify-center"
              />
            </div>

            {/* Error status card */}
            {error && (
              <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="leading-tight">{error}</span>
              </div>
            )}

            {/* Submitting state feedback */}
            {submitting && (
              <div className="p-3 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs flex items-center gap-2 animate-pulse">
                <svg className="w-4 h-4 shrink-0 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>Authenticating with Google & syncing Atlas database...</span>
              </div>
            )}

            <div className="space-y-3 pt-1 text-center">
              <p className="text-xs sm:text-[13px] text-slate-500 leading-relaxed">
                Use your authorized Google account to access C4GT KIET HUB.
              </p>
              <div className="flex items-center justify-center gap-2 text-[11px] sm:text-xs text-slate-500 bg-slate-100/90 py-2 sm:py-2.5 px-3 rounded-lg border border-slate-200/70">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                </svg>
                <span>Secure authentication for your learning and performance data.</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Access is managed by your C4GT KIET HUB administrator.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="w-full max-w-[420px] mx-auto flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-200/60 flex-shrink-0">
          <span>© 2026 C4GT KIET HUB. All rights reserved.</span>
          <div className="flex items-center gap-3">
            <a className="hover:text-slate-600 transition-colors" href="#">
              Privacy
            </a>
            <span className="text-slate-300">•</span>
            <a className="hover:text-slate-600 transition-colors" href="#">
              Terms
            </a>
          </div>
        </div>
      </div>

      {/* ================= RIGHT BRAND PANEL (50%) ================= */}
      <div className="w-full lg:w-1/2 h-full min-h-[480px] lg:min-h-0 bg-[#0B1220] text-white relative flex flex-col justify-between px-6 sm:px-10 lg:px-12 xl:px-14 py-6 sm:py-8 lg:py-8 border-t lg:border-t-0 border-[#111D33] overflow-hidden">
        {/* Background Technical Texture & Subtle Radial Glow */}
        <div className="absolute inset-0 tech-grid pointer-events-none opacity-90"></div>
        <div className="absolute inset-0 radial-glow pointer-events-none"></div>

        {/* Abstract connected code nodes (SVG background detail) */}
        <svg
          className="absolute bottom-4 left-1/4 w-[420px] h-[300px] pointer-events-none opacity-20"
          fill="none"
          viewBox="0 0 460 340"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M40 80 L180 160 L320 100 L420 220" stroke="#6366F1" strokeDasharray="4 4" strokeWidth="1.5"></path>
          <path d="M180 160 L240 260 L380 280" stroke="#818CF8" strokeDasharray="4 4" strokeWidth="1.5"></path>
          <circle cx="40" cy="80" fill="#6366F1" r="4"></circle>
          <circle cx="180" cy="160" fill="#818CF8" r="5"></circle>
          <circle cx="320" cy="100" fill="#A78BFA" r="4"></circle>
          <circle cx="420" cy="220" fill="#38BDF8" r="5"></circle>
          <circle cx="240" cy="260" fill="#34D399" r="4"></circle>
          <circle cx="380" cy="280" fill="#818CF8" r="4"></circle>
        </svg>

        {/* Top Left: Logo & Cohort Indicator */}
        <div className="relative z-10 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-400/30 flex items-center justify-center shadow-lg shadow-black/50">
              <span className="material-symbols-outlined text-indigo-400 text-[20px] sm:text-[22px]">hub</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold tracking-tight text-white">C4GT KIET HUB</span>
              <span className="px-2 py-0.5 text-[10px] font-mono tracking-wider text-indigo-300 bg-indigo-950/70 border border-indigo-500/30 rounded uppercase font-semibold">
                HUB
              </span>
            </div>
          </div>
          {/* Live telemetry pill */}
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-[#070D1A]/80 border border-[#1B2A47]/80 text-[11px] sm:text-xs text-slate-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>AUTH GATEWAY v2.4</span>
          </div>
        </div>

        {/* Center Content */}
        <div className="relative z-10 max-w-[500px] my-auto py-4 sm:py-6 flex-shrink-0">
          {/* Tag badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase mb-4 sm:mb-5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            LEARN • PRACTICE • GROW TOGETHER
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-[34px] xl:text-4xl font-extrabold tracking-tight text-white leading-tight mb-3 sm:mb-4">
            Learn smarter.<br />
            Grow{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-indigo-200 to-violet-300">
              together.
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6 sm:mb-7 font-normal">
            Access your learning resources, tasks and performance insights from one centralized platform.
          </p>

          {/* 3 Feature Verification Cards */}
          <div className="space-y-2.5 sm:space-y-3">
            <div className="flex items-center gap-3 px-3.5 py-2.5 sm:py-3 rounded-xl bg-[#070D1A]/60 border border-[#1B2A47]/70 text-slate-200 text-xs sm:text-sm">
              <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </div>
              <span className="font-medium">Learning Resources & Modules</span>
            </div>

            <div className="flex items-center gap-3 px-3.5 py-2.5 sm:py-3 rounded-xl bg-[#070D1A]/60 border border-[#1B2A47]/70 text-slate-200 text-xs sm:text-sm">
              <div className="w-5 h-5 rounded-full bg-indigo-500/15 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </div>
              <span className="font-medium">Task Management & Automated PR Reviews</span>
            </div>

            <div className="flex items-center gap-3 px-3.5 py-2.5 sm:py-3 rounded-xl bg-[#070D1A]/60 border border-[#1B2A47]/70 text-slate-200 text-xs sm:text-sm">
              <div className="w-5 h-5 rounded-full bg-violet-500/15 border border-violet-500/40 flex items-center justify-center text-violet-400 shrink-0">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </div>
              <span className="font-medium">Performance Tracking & Cohort Telemetry</span>
            </div>
          </div>
        </div>

        {/* Bottom Left: Trust / Audience Indicator */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] sm:text-xs text-slate-400 border-t border-[#111D33]/80 pt-4 gap-2 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400">✦</span>
            <span>Built for Junior Developers, Mentors & Program Leads</span>
          </div>
          <span className="font-mono text-slate-500">KIET Group of Institutions</span>
        </div>
      </div>
    </div>
  );
}
