import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import UserAvatar from './UserAvatar';
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  Building,
  Briefcase,
  ShieldCheck,
  Edit3,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  KeyRound,
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

export default function ProfileDetailsModal({ isOpen, onClose, onChangePassword }) {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');
  const [memberType, setMemberType] = useState('');
  const [dayScholarHostel, setDayScholarHostel] = useState('DS');
  const [college, setCollege] = useState('KIET');
  const [activeBacklogs, setActiveBacklogs] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setRollNumber(user.rollNumber || '');
      setPhone(user.phone || user.phoneNumber || '');
      setBranch(user.branch || '');
      setDayScholarHostel(user.dayScholarHostel || 'DS');
      setCollege(user.college || 'KIET');
      setActiveBacklogs(user.activeBacklogs || 0);
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
        phone: phone.trim(),
        branch,
        year: Number(year),
        memberType,
        dayScholarHostel,
        college,
        activeBacklogs: Number(activeBacklogs) || 0,
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
    >
      <div className="bg-[#FDFCF9] rounded-2xl border border-[#E0DDD0] shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 select-none">
        {/* Header */}
        <div className="bg-[#1C1B1A] text-white p-4 sm:p-5 border-b border-[#2D2B29] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#2D2B29] text-white rounded-xl shadow-xs border border-white/10">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Student Profile Details</h3>
              <p className="text-xs text-neutral-400">Live verified user document in MongoDB Atlas</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 bg-[#FDFCF9]">
          {saveMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 border ${
                saveMessage.type === 'success'
                  ? 'bg-[#EEECDF] text-[#1C1B1A] border-[#E0DDD0]'
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
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#F9F8F3] border border-[#E0DDD0] rounded-2xl">
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar user={user} size="w-12 h-12" rounded="rounded-xl" className="shadow-xs shrink-0" animate="always" />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-base font-extrabold text-[#1C1B1A] truncate">{user.name}</h4>
                    <p className="text-xs text-[#66645E] font-mono flex items-center gap-1 mt-0.5 truncate">
                      <Mail className="w-3 h-3 text-[#9E9C94] shrink-0" /> {user.email}
                    </p>
                  </div>
                </div>

                {/* ACTION BUTTONS (EDIT PROFILE & OPTIONAL CHANGE PASSWORD) */}
                <div className="flex items-center gap-2 shrink-0">
                  {onChangePassword && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onChangePassword();
                      }}
                      className="px-3 py-2 bg-white hover:bg-[#F4F1E8] text-[#1C1B1A] border border-[#D5D0C2] font-semibold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-[#66645E]" />
                      <span>Change Password</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-3.5 py-2 bg-[#1C1B1A] hover:bg-black text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-xs">
                <div className="p-3.5 bg-white border border-[#E0DDD0] rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-[#66645E] uppercase tracking-wider block">Roll Number</span>
                  <span className="font-bold text-[#1C1B1A] font-mono text-sm">{user.rollNumber || 'Not Set'}</span>
                </div>

                <div className="p-3.5 bg-white border border-[#E0DDD0] rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-[#66645E] uppercase tracking-wider block">Phone Number</span>
                  <span className="font-bold text-[#1C1B1A] font-mono text-sm flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#66645E]" />
                    {user.phone || user.phoneNumber || 'Not Set'}
                  </span>
                </div>

                <div className="p-3.5 bg-white border border-[#E0DDD0] rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-[#66645E] uppercase tracking-wider block">Branch / Department</span>
                  <span className="font-bold text-[#1C1B1A] text-xs">{user.branch || 'Not Set'}</span>
                </div>

                <div className="p-3.5 bg-white border border-[#E0DDD0] rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-[#66645E] uppercase tracking-wider block">Academic Year</span>
                  <span className="font-bold text-[#1C1B1A] text-xs">{user.year ? `${user.year}rd/th Year` : 'Not Set'}</span>
                </div>

                <div className="p-3.5 bg-white border border-[#E0DDD0] rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-[#66645E] uppercase tracking-wider block">Residence Type</span>
                  <span className="font-bold text-[#1C1B1A] text-xs">
                    {user.dayScholarHostel === 'HS' || user.dayScholarHostel === 'Hostel' ? 'Hosteller (HS)' : 'Day Scholar (DS)'}
                  </span>
                </div>

                <div className="p-3.5 bg-white border border-[#E0DDD0] rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-[#66645E] uppercase tracking-wider block">College / Campus</span>
                  <span className="font-bold text-[#1C1B1A] text-xs">{user.college || 'KIET'}</span>
                </div>

                <div className="p-3.5 bg-white border border-[#E0DDD0] rounded-xl space-y-1 sm:col-span-2">
                  <span className="text-[10px] font-bold text-[#66645E] uppercase tracking-wider block">C4GT Track</span>
                  <span className="font-bold text-[#1C1B1A] text-xs">{getTrackLabel(user.memberType)}</span>
                </div>
              </div>
            </div>
          ) : (
            /* EDIT FORM MODE */
            <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#1C1B1A] mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E0DDD0] bg-white rounded-xl text-xs font-semibold focus:ring-1 focus:ring-[#1C1B1A] focus:border-[#1C1B1A] outline-none text-[#1C1B1A]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1C1B1A] mb-1">University Roll Number *</label>
                <input
                  type="text"
                  required
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E0DDD0] bg-white rounded-xl text-xs font-semibold font-mono focus:ring-1 focus:ring-[#1C1B1A] focus:border-[#1C1B1A] outline-none text-[#1C1B1A]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1C1B1A] mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-2 border border-[#E0DDD0] bg-white rounded-xl text-xs font-semibold font-mono focus:ring-1 focus:ring-[#1C1B1A] focus:border-[#1C1B1A] outline-none text-[#1C1B1A]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1C1B1A] mb-1">Branch / Department *</label>
                <select
                  required
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E0DDD0] bg-white rounded-xl text-xs font-semibold focus:ring-1 focus:ring-[#1C1B1A] focus:border-[#1C1B1A] outline-none text-[#1C1B1A]"
                >
                  <option value="">-- Select Branch --</option>
                  {BRANCH_OPTIONS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#1C1B1A] mb-1">Academic Year *</label>
                <div className="grid grid-cols-2 gap-2">
                  {YEAR_OPTIONS.map((y) => (
                    <button
                      key={y.value}
                      type="button"
                      onClick={() => handleYearSelect(String(y.value))}
                      className={`p-2.5 rounded-xl border text-center font-bold text-xs cursor-pointer transition-colors ${
                        String(year) === String(y.value)
                          ? 'border-[#1C1B1A] bg-[#EEECDF] text-[#1C1B1A] ring-1 ring-[#1C1B1A]'
                          : 'border-[#E0DDD0] bg-white text-[#4A4843] hover:bg-[#F9F8F3]'
                      }`}
                    >
                      {y.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1C1B1A] mb-1">Residence Type</label>
                  <select
                    value={dayScholarHostel}
                    onChange={(e) => setDayScholarHostel(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E0DDD0] bg-white rounded-xl text-xs font-semibold focus:ring-1 focus:ring-[#1C1B1A] focus:border-[#1C1B1A] outline-none text-[#1C1B1A]"
                  >
                    <option value="DS">Day Scholar (DS)</option>
                    <option value="HS">Hosteller (HS)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#1C1B1A] mb-1">College / Campus</label>
                  <input
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E0DDD0] bg-white rounded-xl text-xs font-semibold focus:ring-1 focus:ring-[#1C1B1A] focus:border-[#1C1B1A] outline-none text-[#1C1B1A]"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#E0DDD0]">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-[#4A4843] border border-[#D5D0C2] rounded-xl hover:bg-[#F4F1E8] cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-[#1C1B1A] hover:bg-black text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60 transition-all"
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
