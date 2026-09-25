import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { useAuth, isStudentProfileComplete } from '../context/AuthContext';
import C4GTLogo from '../components/C4GTLogo';
import { ArrowLeft, AlertCircle, Eye, EyeOff, Lock, User, Sparkles, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const { user, isAuthenticated, loginWithRollNumber, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [rollNumber, setRollNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Restore remembered roll number on initial mount
  useEffect(() => {
    try {
      const savedRoll = localStorage.getItem('c4gt_remembered_roll');
      if (savedRoll && savedRoll.trim()) {
        setRollNumber(savedRoll.trim());
        setRememberMe(true);
      }
    } catch {
      // Graceful fallback if localStorage is unavailable
    }
  }, []);

  const resolveRedirectPath = (authUser, fromPath) => {
    const role = authUser?.role ? String(authUser.role).toLowerCase().trim() : 'student';

    // If navigated from a specific protected page, return there (excluding public landing pages)
    if (
      fromPath &&
      typeof fromPath === 'string' &&
      fromPath !== '/' &&
      fromPath !== '/home' &&
      fromPath !== '/login'
    ) {
      return fromPath;
    }

    if (role === 'admin') {
      return '/admin';
    }

    if (role === 'teamlead' || role === 'team_lead') {
      return '/teamlead';
    }

    // Student / user -> redirect straight to student dashboard
    return '/student';
  };

  // If already authenticated, redirect to appropriate dashboard workspace
  if (!loading && isAuthenticated && user) {
    if (
      !isStudentProfileComplete(user) &&
      user.role !== 'admin' &&
      user.role !== 'teamlead' &&
      user.role !== 'team_lead'
    ) {
      return <Navigate to="/complete-profile" replace />;
    }
    const targetPath = resolveRedirectPath(user, location.state?.from?.pathname);
    return <Navigate to={targetPath} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rollNumber.trim() || !password.trim()) {
      setError('Please enter both your Roll Number and Password.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const loggedInUser = await loginWithRollNumber(rollNumber.trim(), password.trim());

      // Save or remove roll number according to Remember Me checkbox
      try {
        if (rememberMe) {
          localStorage.setItem('c4gt_remembered_roll', rollNumber.trim().toUpperCase());
        } else {
          localStorage.removeItem('c4gt_remembered_roll');
        }
      } catch {
        // Ignore storage errors
      }

      const dest = resolveRedirectPath(loggedInUser, location.state?.from?.pathname);
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[88vh] flex items-center justify-center px-4 sm:px-6 py-6 sm:py-12 bg-[#F9F8F3]">
      <div className="w-full max-w-[420px] space-y-4 sm:space-y-5">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-[#66645E] hover:text-[#1C1B1A] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to main website</span>
        </Link>

        {/* Login Card */}
        <div className="bg-[#FDFCF9] rounded-2xl sm:rounded-3xl border border-[#E0DDD0] p-6 sm:p-8 shadow-xs sm:shadow-sm space-y-5 sm:space-y-6">
          {/* Logo & Heading */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-2">
              <C4GTLogo showText={false} imgClassName="h-12 sm:h-14" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#1C1B1A] text-white text-[10px] font-mono font-bold tracking-wider uppercase">
              <Sparkles className="w-3 h-3 text-amber-300" />
              C4GT HUB 2026 – 2027
            </div>
            <h1 className="text-2xl sm:text-[26px] font-bold text-[#1C1B1A] tracking-tight">
              Sign In to C4GT HUB
            </h1>
            <p className="text-xs text-[#66645E] max-w-xs mx-auto leading-relaxed">
              Enter your Roll Number and Password to access your dashboard.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Roll Number Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-semibold uppercase text-[#1C1B1A] block">
                Roll Number
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#66645E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="e.g. 23B21A4XXX"
                  autoFocus={!rollNumber}
                  required
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-[#E0DDD0] bg-white text-xs sm:text-sm font-mono text-[#1C1B1A] tracking-wider focus:outline-hidden focus:border-[#1C1B1A] shadow-2xs placeholder:normal-case placeholder:tracking-normal placeholder:font-sans"
                />
              </div>
            </div>

            {/* Password Input (Clean professional label, no clutter) */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-semibold uppercase text-[#1C1B1A] block">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#66645E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoFocus={Boolean(rollNumber)}
                  required
                  className="w-full pl-10 pr-10 py-2.5 sm:py-3 rounded-xl border border-[#E0DDD0] bg-white text-xs sm:text-sm text-[#1C1B1A] focus:outline-hidden focus:border-[#1C1B1A] shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#66645E] hover:text-[#1C1B1A] p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs sm:text-sm text-[#4A4843] hover:text-[#1C1B1A] transition-colors">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 accent-blue-600 border-[#D2CEBE] focus:ring-0 cursor-pointer"
                />
                <span className="font-normal text-xs sm:text-sm">Remember me</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 sm:py-3.5 rounded-xl bg-[#1C1B1A] hover:bg-black text-white text-xs sm:text-sm font-semibold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer mt-3 disabled:opacity-70 active:scale-[0.99]"
            >
              {submitting ? (
                <span>Signing In...</span>
              ) : (
                <>
                  <span>Sign In to Workspace</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
