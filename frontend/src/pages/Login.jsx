import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { useAuth, getDashboardPath, isStudentProfileComplete } from '../context/AuthContext';
import C4GTLogo from '../components/C4GTLogo';
import { ArrowLeft, AlertCircle, Eye, EyeOff, Lock, User, Sparkles, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const { user, isAuthenticated, loginWithRollNumber, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [rollNumber, setRollNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const resolveRedirectPath = (authUser, fromPath) => {
    const dest = getDashboardPath(authUser?.role);
    if (!fromPath || typeof fromPath !== 'string') return dest;

    const role = authUser?.role ? String(authUser.role).toLowerCase().trim() : 'student';
    if (role === 'admin' && fromPath.startsWith('/admin')) return fromPath;
    if (
      (role === 'teamlead' || role === 'team_lead') &&
      (fromPath.startsWith('/teamlead') ||
        fromPath.startsWith('/team-lead') ||
        fromPath.startsWith('/student'))
    )
      return fromPath;
    if ((role === 'student' || role === 'user') && fromPath.startsWith('/student')) return fromPath;

    return dest;
  };

  // If already authenticated, redirect to appropriate workspace
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
      const dest = resolveRedirectPath(loggedInUser, location.state?.from?.pathname);
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-[#F9F8F3]">
      <div className="w-full max-w-md space-y-6">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-[#66645E] hover:text-[#1C1B1A] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to main website</span>
        </Link>

        {/* Login Card */}
        <div className="bg-[#FDFCF9] rounded-3xl border border-[#E0DDD0] p-8 shadow-sm space-y-6">
          {/* Logo & Heading */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-3">
              <C4GTLogo showText={false} imgClassName="h-14" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#1C1B1A] text-white text-[10px] font-mono font-bold tracking-wider uppercase">
              <Sparkles className="w-3 h-3 text-amber-300" />
              Cohort 2026 – 2027
            </div>
            <h1 className="font-['Instrument_Serif',serif] text-3xl sm:text-4xl font-bold text-[#1C1B1A] tracking-tight">
              Sign In to C4GT HUB
            </h1>
            <p className="text-xs text-[#66645E]">
              Enter your Roll Number and Password to access your team and student dashboard.
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
                  placeholder="e.g. 23B21A4268 or admin@"
                  autoFocus
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E0DDD0] bg-white text-xs font-mono text-[#1C1B1A] tracking-wider focus:outline-hidden focus:border-[#1C1B1A] shadow-2xs placeholder:normal-case placeholder:tracking-normal placeholder:font-sans"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-semibold uppercase text-[#1C1B1A]">
                  Password
                </label>
                <span className="text-[10px] text-[#88867E]">Default: Roll Number</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#66645E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#E0DDD0] bg-white text-xs text-[#1C1B1A] focus:outline-hidden focus:border-[#1C1B1A] shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#66645E] hover:text-[#1C1B1A] p-1"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-[#1C1B1A] hover:bg-black text-white text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-70"
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

          {/* Information Callout */}
          <div className="p-3.5 rounded-2xl bg-[#F2EFE6] border border-[#E0DDD0] text-[11px] text-[#66645E] space-y-1.5 leading-relaxed">
            <div className="font-semibold text-[#1C1B1A] flex items-center gap-1.5">
              <span>Login Help</span>
            </div>
            <p>
              • <strong>Students & Leads:</strong> Use your College Roll Number as both username and initial password (e.g. <code className="font-mono text-[#1C1B1A] bg-white px-1 py-0.5 rounded">23B21A4268</code>).
            </p>
            <p>
              • <strong>Team Leads:</strong> Sign in with your Lead Roll Number to automatically view and manage your team.
            </p>
            <p>
              • <strong>Admin:</strong> Predefined login using Roll Number <code className="font-mono text-[#1C1B1A] bg-white px-1 py-0.5 rounded">admin@</code> and password <code className="font-mono text-[#1C1B1A] bg-white px-1 py-0.5 rounded">admin@</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
