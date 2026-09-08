import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap,
  Building,
  Calendar,
  Briefcase,
  Mail,
  ShieldCheck,
  Edit3,
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  User,
  Save,
  AlertCircle,
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
  { value: 3, label: '3rd Year', sub: '5th & 6th Sem', autoTrack: 'Junior Developer (JD)' },
  { value: 4, label: '4th Year', sub: '7th & 8th Sem', autoTrack: 'Senior Developer' },
];

export default function StudentDashboard() {
  const { user, updateProfile } = useAuth();

  // Profile Update Form State
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');
  const [memberType, setMemberType] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

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
    // Auto-select: 3rd Year -> Junior Developer (JD), 4th Year -> Senior Developer
    if (selectedYear === '3') {
      setMemberType('junior_developer');
    } else if (selectedYear === '4') {
      setMemberType('senior_developer');
    }
  };

  const handleTrackSelect = (selectedType) => {
    setMemberType(selectedType);
    if (selectedType === 'junior_developer') {
      setYear('3');
    } else if (selectedType === 'senior_developer') {
      setYear('4');
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaveMessage(null);

    if (!name.trim()) {
      setSaveMessage({ type: 'error', text: 'Full Name cannot be empty.' });
      return;
    }
    if (!rollNumber.trim()) {
      setSaveMessage({ type: 'error', text: 'University Roll Number is required.' });
      return;
    }
    if (!branch) {
      setSaveMessage({ type: 'error', text: 'Please select your Branch / Department.' });
      return;
    }
    if (!year) {
      setSaveMessage({ type: 'error', text: 'Please select your Academic Year.' });
      return;
    }

    try {
      setSaving(true);
      await updateProfile({
        name: name.trim(),
        rollNumber: rollNumber.trim(),
        branch,
        year: Number(year),
        memberType,
      });

      setSaveMessage({
        type: 'success',
        text: 'Your student profile details have been successfully updated in MongoDB Atlas!',
      });
      setTimeout(() => setSaveMessage(null), 6000);
    } catch (err) {
      setSaveMessage({
        type: 'error',
        text: err.message || 'Failed to update student profile.',
      });
    } finally {
      setSaving(false);
    }
  };

  const scrollToProfileSection = () => {
    document.getElementById('profile-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const getMemberTypeLabel = (type) => {
    switch (type) {
      case 'junior_developer':
        return 'Junior Developer (JD)';
      case 'senior_developer':
        return 'Senior Developer';
      case 'developer_intern':
        return 'Senior Developer';
      default:
        return type || 'Participant';
    }
  };

  const getYearLabel = (yr) => {
    switch (Number(yr)) {
      case 3:
        return '3rd Year (5th & 6th Sem)';
      case 4:
        return '4th Year (7th & 8th Sem)';
      default:
        return yr ? `Year ${yr}` : 'Not Specified';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 sm:p-8 text-white shadow-md">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            Verified Student Workspace
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name || 'Student'}!
          </h1>
          <p className="text-sm text-blue-100 max-w-xl leading-relaxed">
            Access your cohort deliverables, milestone deliverables, and technical learning resources below.
          </p>
        </div>

        <Button
          onClick={scrollToProfileSection}
          variant="outline"
          size="sm"
          className="bg-white/10 hover:bg-white/20 text-white border-white/30 text-xs shrink-0 cursor-pointer flex items-center gap-1.5"
        >
          <Edit3 className="w-3.5 h-3.5" />
          Update Profile Details
        </Button>
      </div>

      {/* Cohort Deliverables & Learning Milestones */}
      <Card className="shadow-xs border-gray-200">
        <CardHeader className="pb-3 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-lg">Cohort Deliverables & Assignments</CardTitle>
              <CardDescription>
                Upcoming milestones, deliverables, and technical tasks assigned to your cohort.
              </CardDescription>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 w-fit">
              <Sparkles className="w-3.5 h-3.5" />
              Active Workspace
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex items-start gap-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900">
                Orientation & Open Source Standards
              </h4>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Review the C4GT repository contribution guidelines, Git branching conventions, and code review standards.
              </p>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full mt-2">
                <Clock className="w-3 h-3" /> In Progress
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex items-start gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900">
                Student Verification & Atlas Sync
              </h4>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Profile registered with official university roll number and synchronized directly with MongoDB Atlas.
              </p>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-2">
                <CheckCircle2 className="w-3 h-3" /> Completed
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DEDICATED PROFILE SECTION WITH UPDATE OPTION (Below all sections) */}
      <section id="profile-section" className="pt-2">
        <Card className="shadow-md border-gray-200/90 overflow-hidden">
          <CardHeader className="bg-slate-900 text-white py-5 px-6 border-b border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-white">
                    Student Profile Settings
                  </CardTitle>
                  <CardDescription className="text-slate-300 text-xs mt-0.5">
                    Update your official university roll number, branch, academic year, and track.
                  </CardDescription>
                </div>
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full self-start sm:self-auto">
                <ShieldCheck className="w-3.5 h-3.5" />
                Saved in MongoDB Atlas
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 sm:p-8">
            {/* Feedback Notifications */}
            {saveMessage && (
              <div
                className={`p-4 mb-6 rounded-xl text-xs font-medium flex items-start gap-2.5 border ${
                  saveMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-red-50 text-red-800 border-red-200'
                }`}
              >
                {saveMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">{saveMessage.text}</div>
                <button
                  type="button"
                  onClick={() => setSaveMessage(null)}
                  className="text-gray-400 hover:text-gray-600 ml-2"
                >
                  ✕
                </button>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Swamy Rayudu"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white"
                      required
                    />
                  </div>
                </div>

                {/* Email Address (Read-only Google verified) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Official College Email <span className="text-gray-400 font-normal">(Verified)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                      onChange={(e) => setRollNumber(e.target.value)}
                      placeholder="e.g. 23B21A4595"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white font-mono"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Your official university roll number as registered in KIET.
                  </p>
                </div>

                {/* Branch / Department Dropdown */}
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
                      onChange={(e) => setBranch(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-gray-300 appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent cursor-pointer"
                      required
                    >
                      <option value="">-- Select Branch --</option>
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
                </div>
              </div>

              {/* Academic Year Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Academic Year <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {YEAR_OPTIONS.map((y) => {
                    const isSelected = String(year) === String(y.value);
                    return (
                      <button
                        key={y.value}
                        type="button"
                        onClick={() => handleYearSelect(String(y.value))}
                        className={`p-4 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/80 text-blue-900 ring-2 ring-blue-600 font-semibold shadow-xs'
                            : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <div className="text-base font-bold">{y.label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{y.sub}</div>
                        <div className="mt-2 inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          Auto: {y.autoTrack}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Member Track Interactive Cards */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    C4GT Member Track <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-blue-600 font-medium">
                    Auto-selected: 3rd Year → Junior Dev (JD) | 4th Year → Senior Dev
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Junior Developer Card */}
                  <div
                    onClick={() => handleTrackSelect('junior_developer')}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      memberType === 'junior_developer'
                        ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600 shadow-xs'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Briefcase className={`w-4 h-4 ${memberType === 'junior_developer' ? 'text-blue-600' : 'text-gray-400'}`} />
                        <span className="text-sm font-bold text-gray-900">Junior Developer (JD)</span>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        memberType === 'junior_developer' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        3rd Year Track
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                      Core development track focusing on technical skill acquisition, foundational milestone deliverables, and code standards.
                    </p>
                    {memberType === 'junior_developer' && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-blue-700 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                        Selected Track
                      </div>
                    )}
                  </div>

                  {/* Senior Developer Card */}
                  <div
                    onClick={() => handleTrackSelect('senior_developer')}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      memberType === 'senior_developer' || memberType === 'developer_intern'
                        ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600 shadow-xs'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Briefcase className={`w-4 h-4 ${memberType === 'senior_developer' || memberType === 'developer_intern' ? 'text-blue-600' : 'text-gray-400'}`} />
                        <span className="text-sm font-bold text-gray-900">Senior Developer</span>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        memberType === 'senior_developer' || memberType === 'developer_intern' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        4th Year Track
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                      Advanced deliverables track focusing on architectural planning, milestone leadership, mentorship, and high-impact contributions.
                    </p>
                    {(memberType === 'senior_developer' || memberType === 'developer_intern') && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-blue-700 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                        Selected Track
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Update Button */}
              <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-gray-500">
                  Updates sync directly with your live MongoDB Atlas document.
                </p>
                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving to Atlas...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Update Profile Details
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
