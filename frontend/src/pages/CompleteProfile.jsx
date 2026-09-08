import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useAuth, getDashboardPath, isStudentProfileComplete } from '../context/AuthContext';
import {
  User,
  GraduationCap,
  Building,
  Calendar,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  LogOut,
  ArrowRight,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

const BRANCH_OPTIONS = [
  'CSE - Computer Science & Engineering',
  'AIDS - Artificial Intelligence & Data Science',
  'Cyber - Cyber Security',
  'AI - Artificial Intelligence',
  'CSD - Computer Science (Data Science)',
  'CSM - Computer Science & Machine Learning',
];

const YEAR_OPTIONS = [
  { value: 3, label: '3rd Year', sub: '5th & 6th Semester' },
  { value: 4, label: '4th Year', sub: '7th & 8th Semester' },
];

const MEMBER_TYPES = [
  {
    value: 'junior_developer',
    title: 'Junior Developer (JD)',
    description: 'Auto-assigned for 3rd Year students focusing on core development & fundamentals.',
    tag: '3rd Year Track',
  },
  {
    value: 'senior_developer',
    title: 'Senior Developer',
    description: 'Auto-assigned for 4th Year students focusing on advanced project deliverables & leadership.',
    tag: '4th Year Track',
  },
];

export default function CompleteProfile() {
  const { user, isAuthenticated, loading, updateProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');
  const [memberType, setMemberType] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setRollNumber(user.rollNumber || '');
      setBranch(user.branch || '');
      const initialYear = user.year ? String(user.year) : '';
      setYear(initialYear);

      if (user.memberType) {
        setMemberType(user.memberType);
      } else if (initialYear === '3') {
        setMemberType('junior_developer');
      } else if (initialYear === '4') {
        setMemberType('senior_developer');
      }
    }
  }, [user]);

  const handleYearSelect = (selectedYear) => {
    setYear(selectedYear);
    if (formErrors.year) setFormErrors((prev) => ({ ...prev, year: null }));
    if (formErrors.memberType) setFormErrors((prev) => ({ ...prev, memberType: null }));

    // Auto-select: 3rd Year -> Junior Developer (JD), 4th Year -> Senior Developer
    if (selectedYear === '3') {
      setMemberType('junior_developer');
    } else if (selectedYear === '4') {
      setMemberType('senior_developer');
    }
  };

  const handleMemberTypeSelect = (selectedType) => {
    setMemberType(selectedType);
    if (formErrors.memberType) setFormErrors((prev) => ({ ...prev, memberType: null }));
    if (formErrors.year) setFormErrors((prev) => ({ ...prev, year: null }));

    // Synchronize year: Junior Developer -> 3rd Year, Senior Developer -> 4th Year
    if (selectedType === 'junior_developer') {
      setYear('3');
    } else if (selectedType === 'senior_developer') {
      setYear('4');
    }
  };


  const validate = () => {
    const errors = {};
    if (!name.trim()) {
      errors.name = 'Full Name is required.';
    }

    if (!rollNumber.trim()) {
      errors.rollNumber = 'University Roll Number is required.';
    } else if (rollNumber.trim().length < 6) {
      errors.rollNumber = 'Please enter a valid official roll number.';
    }

    if (!branch) {
      errors.branch = 'Please select your Branch / Department.';
    }

    if (!year) {
      errors.year = 'Please select your Academic Year.';
    }

    if (!memberType) {
      errors.memberType = 'Please select your Member Track.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validate()) {
      return;
    }

    try {
      setSubmitting(true);
      const updatedUser = await updateProfile({
        name: name.trim(),
        rollNumber: rollNumber.trim(),
        branch,
        year: Number(year),
        memberType,
      });

      // Successful persistence directly to MongoDB Atlas
      navigate('/', { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save student details. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-10 px-4">
      {/* Top Banner Alert */}
      <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border border-blue-200/80 shadow-xs flex items-start gap-3">
        <div className="p-2 bg-blue-600 text-white rounded-lg shrink-0 mt-0.5 shadow-xs">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-blue-900">
            Mandatory Student Information Required
          </h3>
          <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
            Welcome to C4GT KIET HUB! To activate your student workspace, track project tasks, and submit deliverables, please complete your official student details below.
          </p>
        </div>
      </div>

      <Card className="shadow-md border-gray-200/90 overflow-hidden">
        {/* Header with Google Identity */}
        <CardHeader className="bg-slate-900 text-white pb-6 pt-6 px-6 border-b border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-12 h-12 rounded-full border-2 border-blue-400 object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg text-white font-bold">
                    {user?.name || 'Student Profile'}
                  </CardTitle>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3" />
                    Verified
                  </span>
                </div>
                <CardDescription className="text-slate-300 text-xs mt-0.5 font-mono">
                  {user?.email}
                </CardDescription>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-md hover:bg-slate-800 transition-colors cursor-pointer self-start sm:self-center"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-6 sm:p-8 space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: null }));
                  }}
                  placeholder="e.g. Rahul Sharma"
                  className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border ${
                    formErrors.name ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent`}
                />
              </div>
              {formErrors.name && (
                <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>
              )}
            </div>

            {/* University Roll Number */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                University / College Roll Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={rollNumber}
                  onChange={(e) => {
                    setRollNumber(e.target.value);
                    if (formErrors.rollNumber)
                      setFormErrors((prev) => ({ ...prev, rollNumber: null }));
                  }}
                  placeholder="e.g. 2100290100045"
                  className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border ${
                    formErrors.rollNumber
                      ? 'border-red-300 ring-1 ring-red-300'
                      : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-mono`}
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Enter your official university roll number as issued by KIET / AKTU.
              </p>
              {formErrors.rollNumber && (
                <p className="text-xs text-red-600 mt-1">{formErrors.rollNumber}</p>
              )}
            </div>

            {/* Branch / Department */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Branch / Department <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Building className="w-4 h-4" />
                </div>
                <select
                  value={branch}
                  onChange={(e) => {
                    setBranch(e.target.value);
                    if (formErrors.branch) setFormErrors((prev) => ({ ...prev, branch: null }));
                  }}
                  className={`w-full pl-9 pr-8 py-2 text-sm rounded-lg border appearance-none bg-white ${
                    formErrors.branch ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent cursor-pointer`}
                >
                  <option value="">-- Select Your Branch / Department --</option>
                  {BRANCH_OPTIONS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {formErrors.branch && (
                <p className="text-xs text-red-600 mt-1">{formErrors.branch}</p>
              )}
            </div>

            {/* Academic Year */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Current Academic Year <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {YEAR_OPTIONS.map((y) => {
                  const isSelected = String(year) === String(y.value);
                  return (
                    <button
                      key={y.value}
                      type="button"
                      onClick={() => handleYearSelect(String(y.value))}
                      className={`p-3.5 rounded-lg border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/80 text-blue-900 ring-2 ring-blue-600 font-semibold shadow-xs'
                          : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <div className="text-base font-bold">{y.label}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">{y.sub}</div>
                      <div className="mt-2 inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100/70 text-blue-800">
                        {y.value === 3 ? 'Auto: Junior Dev (JD)' : 'Auto: Senior Dev'}
                      </div>
                    </button>
                  );
                })}
              </div>
              {formErrors.year && (
                <p className="text-xs text-red-600 mt-1">{formErrors.year}</p>
              )}
            </div>

            {/* Member Type / Track */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  C4GT Member Track <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-blue-600 font-medium">
                  Auto-selected based on Academic Year
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MEMBER_TYPES.map((m) => {
                  const isSelected = memberType === m.value;
                  return (
                    <div
                      key={m.value}
                      onClick={() => handleMemberTypeSelect(m.value)}
                      className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-600'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Briefcase className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                          <span className="text-xs font-bold text-gray-900">{m.title}</span>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {m.tag}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                        {m.description}
                      </p>
                      {isSelected && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-blue-700 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                          Selected Track
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {formErrors.memberType && (
                <p className="text-xs text-red-600 mt-1">{formErrors.memberType}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-gray-400 text-center sm:text-left">
                Your details are stored securely in MongoDB Atlas.
              </p>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving to MongoDB Atlas...
                  </>
                ) : (
                  <>
                    Save Student Details & Continue
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
