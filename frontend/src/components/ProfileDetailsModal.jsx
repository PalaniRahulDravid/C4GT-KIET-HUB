import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Mail,
  GraduationCap,
  Building,
  Briefcase,
  ShieldCheck,
  Edit3,
  Save,
  X,
  CheckCircle2,
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

export default function ProfileDetailsModal({ isOpen, onClose }) {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  // Form states
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
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleYearSelect = (selectedYear) => {
    setYear(selectedYear);
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
        text: 'Profile updated successfully in MongoDB Atlas!',
      });

      setTimeout(() => {
        setIsEditing(false);
        setSaveMessage(null);
      }, 1500);
    } catch (err) {
      setSaveMessage({
        type: 'error',
        text: err.message || 'Failed to update student profile.',
      });
    } finally {
      setSaving(false);
    }
  };

  const getTrackLabel = (type) => {
    switch (type) {
      case 'junior_developer':
        return 'Junior Developer (JD)';
      case 'senior_developer':
      case 'developer_intern':
        return 'Senior Developer';
      default:
        return type || 'Participant';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
    >
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 select-none">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Student Profile Details</h3>
              <p className="text-xs text-slate-300">Live verified user document in MongoDB Atlas</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {saveMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 border ${
                saveMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}
            >
              {saveMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{saveMessage.text}</span>
            </div>
          )}

          {!isEditing ? (
            /* VIEW MODE: STUDENT INFORMATION */
            <div className="space-y-5">
              <div className="flex items-center justify-between p-4 bg-blue-50/70 border border-blue-100 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center text-base font-bold shadow-xs">
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-gray-900">{user.name}</h4>
                    <p className="text-xs text-blue-700 font-mono flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3" /> {user.email}
                    </p>
                  </div>
                </div>

                {/* EDIT PROFILE BUTTON (ONLY INSIDE PROFILE DETAILS) */}
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Roll Number</span>
                  <span className="font-bold text-gray-900 font-mono text-sm">{user.rollNumber || 'Not Set'}</span>
                </div>

                <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Branch / Department</span>
                  <span className="font-bold text-gray-900 text-xs">{user.branch || 'Not Set'}</span>
                </div>

                <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Academic Year</span>
                  <span className="font-bold text-gray-900 text-xs">{user.year ? `${user.year}rd/th Year` : 'Not Set'}</span>
                </div>

                <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">C4GT Track</span>
                  <span className="font-bold text-blue-700 text-xs">{getTrackLabel(user.memberType)}</span>
                </div>
              </div>
            </div>
          ) : (
            /* EDIT FORM MODE */
            <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">University Roll Number *</label>
                <input
                  type="text"
                  required
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-semibold font-mono focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Branch / Department *</label>
                <select
                  required
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-600 outline-none"
                >
                  <option value="">-- Select Branch --</option>
                  {BRANCH_OPTIONS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Academic Year *</label>
                <div className="grid grid-cols-2 gap-2">
                  {YEAR_OPTIONS.map((y) => (
                    <button
                      key={y.value}
                      type="button"
                      onClick={() => handleYearSelect(String(y.value))}
                      className={`p-2.5 rounded-xl border text-center font-bold text-xs cursor-pointer ${
                        String(year) === String(y.value)
                          ? 'border-blue-600 bg-blue-50 text-blue-900 ring-1 ring-blue-600'
                          : 'border-gray-200 bg-white text-gray-700'
                      }`}
                    >
                      {y.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      Save Profile Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
