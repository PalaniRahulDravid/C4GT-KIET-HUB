import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { useAuth, getDashboardPath, isStudentProfileComplete } from '../context/AuthContext';
import C4GTLogo from '../components/C4GTLogo';
import { motion } from 'motion/react';
import { ArrowLeft, AlertCircle } from 'lucide-react';

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
          const currentWidth = googleBtnRef.current?.offsetWidth || 400;
          const calculatedWidth = Math.min(Math.max(currentWidth, 240), 400);

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
    <div className="w-full min-h-screen bg-[#F9F8F3] text-[#1C1B1A] font-sans antialiased selection:bg-[#1C1B1A] selection:text-white flex flex-col justify-center items-center p-5 sm:p-10 relative overflow-x-hidden">
      {/* Subtle Ambient Background Lighting */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-12 left-1/4 w-[600px] h-[500px] rounded-full bg-[#E3EFE1]/40 blur-3xl opacity-70" />
        <div className="absolute bottom-12 right-1/4 w-[550px] h-[450px] rounded-full bg-[#FBE5DC]/35 blur-3xl opacity-60" />
      </div>

      {/* Top-Left Back to Home Button (Far Left on Desktop) */}
      <motion.div
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="absolute top-6 left-5 sm:top-10 sm:left-12 z-20"
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2.5 h-[52px] sm:h-[56px] px-6 text-base sm:text-[17px] font-medium text-[#1C1B1A] bg-[#FFFDF8] hover:bg-[#F5F3EB] border border-[#E2DDD0] rounded-full shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
        >
          <ArrowLeft className="w-5 h-5 text-[#66645E] group-hover:text-[#1C1B1A] group-hover:-translate-x-1 transition-transform" />
          <span>Back to Home</span>
        </Link>
      </motion.div>

      {/* Main Centered Login Card (Larger: max-w-[580px], padding: 48px-64px) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-full max-w-[580px] z-10 my-auto py-12 sm:py-16"
      >
        <div className="bg-[#FFFDF8] border border-[#E2DDD0] rounded-[32px] shadow-sm hover:shadow-md transition-shadow p-8 sm:p-14 text-center relative">
          {/* C4GT HUB @ KIET Logo */}
          <div className="mb-8 inline-block">
            <div className="p-3.5 rounded-2xl bg-white border border-[#E2DDD0] shadow-2xs inline-block">
              <C4GTLogo showText={false} imgClassName="h-16 sm:h-20" />
            </div>
          </div>

          {/* Heading & Subtitle */}
          <h1 className="font-['Instrument_Serif',serif] text-4xl sm:text-5xl text-[#1C1B1A] font-normal tracking-tight leading-tight">
            Welcome back.
          </h1>
          <p className="text-base sm:text-lg text-[#66645E] mt-3 font-normal leading-relaxed">
            Sign in to continue to C4GT KIET HUB.
          </p>

          {/* Google Sign-In Action Area */}
          <div className="mt-10 space-y-5">
            <div className="relative w-full">
              <button
                type="button"
                onClick={handleCustomBtnClick}
                disabled={submitting}
                className="w-full h-[58px] sm:h-[62px] bg-[#FFFDF8] hover:bg-[#F5F3EB] active:scale-[0.995] border border-[#E2DDD0] hover:border-[#D4CEBF] text-[#1C1B1A] text-base sm:text-lg font-semibold rounded-2xl transition-all flex items-center justify-center gap-3.5 shadow-2xs hover:shadow-xs cursor-pointer group focus:outline-none focus:ring-2 focus:ring-[#1C1B1A]/20 relative overflow-hidden"
              >
                {submitting ? (
                  <div className="flex items-center gap-3 text-[#1C1B1A] font-medium text-base">
                    <svg className="animate-spin h-5 w-5 text-[#1C1B1A]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Authenticating with Google...</span>
                  </div>
                ) : (
                  <>
                    <svg className="w-6 h-6 transition-transform group-hover:scale-105 shrink-0" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        fill="#EA4335"
                      />
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

            {/* Error Status Alert */}
            {error && (
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/80 text-rose-800 text-xs sm:text-sm flex items-center justify-center gap-2.5 text-left">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span className="leading-tight font-medium">{error}</span>
              </div>
            )}

            {/* Submitting State Indicator */}
            {submitting && (
              <div className="p-4 rounded-xl border border-[#E2DDD0] bg-[#E3EFE1]/40 text-[#2F5233] text-xs sm:text-sm flex items-center justify-center gap-2.5 animate-pulse">
                <svg className="w-4 h-4 shrink-0 animate-spin text-[#2F5233]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Authenticating with Google...</span>
              </div>
            )}

            {/* Small Muted Legal / Usage Text */}
            <p className="text-xs sm:text-sm text-[#8C8A84] text-center leading-relaxed pt-2">
              By continuing, you agree to use C4GT KIET HUB responsibly for learning and development.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
