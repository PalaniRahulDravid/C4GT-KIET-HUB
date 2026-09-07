import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useAuth, getDashboardPath } from '../context/AuthContext';

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

  // Synchronously prevent authenticated users from viewing or accessing the login/Google auth page
  if (!loading && isAuthenticated && user) {
    const targetPath = location.state?.from?.pathname || getDashboardPath(user.role);
    return <Navigate to={targetPath} replace />;
  }

  // Initialize official Google Identity Services (GIS) button cleanly once
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
                  const dest = location.state?.from?.pathname || getDashboardPath(loggedInUser.role);
                  navigate(dest, { replace: true });
                } catch (err) {
                  setError(err.message || 'Google authentication failed');
                } finally {
                  setSubmitting(false);
                }
              }
            },
          });

          // Render Google standard "Continue with Google" button
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            shape: 'rectangular',
            text: 'continue_with',
            width: 380,
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
      }, 300);
      return () => clearInterval(timer);
    }
  }, [googleClientId, loginWithGoogle, navigate, location]);

  return (
    <div className="max-w-md mx-auto mt-12">
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="text-center pb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-blue-600 mx-auto mb-3">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">
            Sign In to C4GT HUB
          </CardTitle>
          <CardDescription className="text-sm text-gray-500 max-w-xs mx-auto">
            Use your official Google account to sign in and sync directly with MongoDB Atlas.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 pt-2">
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          {/* Official Google Identity Services Button */}
          <div className="flex flex-col items-center justify-center min-h-[44px]">
            <div ref={googleBtnRef} className="w-full flex justify-center" />
            {submitting && (
              <p className="text-xs text-blue-600 mt-2 animate-pulse font-medium">
                Authenticating with Google & syncing Atlas database...
              </p>
            )}
          </div>

          <div className="pt-2 text-center text-xs text-gray-500 space-y-1">
            <p>
              New Google users automatically join as <strong>Students</strong> (<code className="text-gray-700 bg-gray-100 px-1 py-0.5 rounded">user</code>).
            </p>
            <p className="text-gray-400 text-[11px]">
              Team Lead and Admin permissions are managed by Platform Administrators.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
