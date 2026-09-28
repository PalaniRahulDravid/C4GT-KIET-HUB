import React, { useState } from 'react';
import {
  X,
  UserPlus,
  User,
  Hash,
  Mail,
  Phone,
  Building,
  GraduationCap,
  Calendar,
  Home,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldAlert,
} from 'lucide-react';

export default function AddStudentModal({
  isOpen,
  onClose,
  team,
  onStudentAdded,
  endpoint,
  token,
}) {
  const [formData, setFormData] = useState({
    name: '',
    rollNumber: '',
    email: '',
    phone: '',
    college: 'KIET',
    branch: 'CSE',
    roleCode: 'JD',
    year: '3',
    type: 'DS',
    backlogs: '0',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isOpen || !team) return null;

  const currentMembersCount = team?.members?.length || 0;
  const totalCount = currentMembersCount + (team?.teamLeadId ? 1 : 0);
  const maxLimit = team?.maxMembers || 9;
  const isFull = currentMembersCount >= 8 || totalCount >= maxLimit;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setError(null);

    if (name === 'roleCode') {
      // Auto-sync year based on roleCode (JD = 3rd Year, SD = 4th Year)
      setFormData((prev) => ({
        ...prev,
        roleCode: value,
        year: value === 'SD' ? '4' : '3',
      }));
      return;
    }

    if (name === 'rollNumber') {
      setFormData((prev) => ({
        ...prev,
        rollNumber: value.toUpperCase(),
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!formData.name.trim()) {
      setError('Please enter the student\'s full name.');
      return;
    }
    if (!formData.rollNumber.trim()) {
      setError('Please enter a valid Roll Number.');
      return;
    }
    if (!formData.email.trim()) {
      setError('Please enter the student\'s email address.');
      return;
    }

    // Client-side guard: do not allow using the team lead's credentials
    const lead = typeof team?.teamLeadId === 'object' ? team.teamLeadId : null;
    if (lead) {
      if (lead.rollNumber && formData.rollNumber.trim().toUpperCase() === lead.rollNumber.toUpperCase()) {
        setError(`Cannot add student: Roll Number "${formData.rollNumber}" belongs to Team Lead (${lead.name}). Please use a unique roll number.`);
        return;
      }
      if (lead.email && formData.email.trim().toLowerCase() === lead.email.toLowerCase()) {
        setError(`Cannot add student: Email "${formData.email}" belongs to Team Lead (${lead.name}). Please use a unique email address.`);
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        rollNumber: formData.rollNumber.trim().toUpperCase(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || undefined,
        phoneNumber: formData.phone.trim() || undefined,
        college: formData.college.trim() || 'KIET',
        branch: formData.branch,
        roleCode: formData.roleCode,
        memberType: formData.roleCode === 'SD' ? 'senior_developer' : 'junior_developer',
        year: Number(formData.year) || (formData.roleCode === 'SD' ? 4 : 3),
        type: formData.type,
        dayScholarHostel: formData.type,
        backlogs: Number(formData.backlogs) || 0,
        activeBacklogs: Number(formData.backlogs) || 0,
        teamId: team._id,
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to add student to team roster.');
      }

      setSuccessMsg(data.message || `Student successfully added to ${team.name}!`);

      if (onStudentAdded) {
        onStudentAdded(data.team, data.member);
      }

      setTimeout(() => {
        onClose();
        // Reset form
        setFormData({
          name: '',
          rollNumber: '',
          email: '',
          phone: '',
          college: 'KIET',
          branch: 'CSE',
          roleCode: 'JD',
          year: '3',
          type: 'DS',
          backlogs: '0',
        });
        setSuccessMsg(null);
      }, 1200);
    } catch (err) {
      console.error('Error adding student:', err);
      setError(err.message || 'An error occurred while adding student.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#FAF9F5] border border-[#E0DDD0] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-white border-b border-[#E0DDD0] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1C1B1A] text-white flex items-center justify-center shadow-xs">
              <UserPlus className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1C1B1A]">Add Student to Team Roster</h2>
              <p className="text-xs text-[#66645E]">
                {team.name} • {team.batch || 'Batch 2026-2027'} • Current Roster: {totalCount} / {maxLimit}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#88867E] hover:text-[#1C1B1A] hover:bg-[#F2EFE6] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content / Form */}
        <div className="p-5 overflow-y-auto custom-scroll space-y-4">
          {/* Capacity warning if full */}
          {isFull && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-800 text-xs">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <span className="font-bold">Team is at full capacity ({maxLimit}/{maxLimit} members).</span>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  If a student member quit, please remove them from the roster first so an open slot is available for this new student.
                </p>
              </div>
            </div>
          )}

          {/* Info note */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-emerald-900 text-xs">
            <p className="font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              Initial Credentials & Login
            </p>
            <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
              Same as initial Excel upload: the student's initial default password will be their <strong>Roll Number</strong>. They can log in immediately and continue assignments with this team.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-medium animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <form id="add-student-form" onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full Name & Roll Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#66645E] flex items-center gap-1 mb-1">
                  <User className="w-3 h-3 text-[#88867E]" />
                  <span>Full Name *</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  required
                  disabled={loading || isFull}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-[#E0DDD0] bg-white text-[#1C1B1A] placeholder:text-[#AAA89F] focus:outline-none focus:ring-2 focus:ring-[#1C1B1A]/20 focus:border-[#1C1B1A] transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#66645E] flex items-center gap-1 mb-1">
                  <Hash className="w-3 h-3 text-[#88867E]" />
                  <span>Roll Number *</span>
                </label>
                <input
                  type="text"
                  name="rollNumber"
                  value={formData.rollNumber}
                  onChange={handleChange}
                  placeholder="e.g. 23B21A4501"
                  required
                  disabled={loading || isFull}
                  className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-[#E0DDD0] bg-white text-[#1C1B1A] placeholder:text-[#AAA89F] focus:outline-none focus:ring-2 focus:ring-[#1C1B1A]/20 focus:border-[#1C1B1A] transition-all uppercase disabled:opacity-50"
                />
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#66645E] flex items-center gap-1 mb-1">
                  <Mail className="w-3 h-3 text-[#88867E]" />
                  <span>Email Address *</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="student@kiet.edu"
                  required
                  disabled={loading || isFull}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-[#E0DDD0] bg-white text-[#1C1B1A] placeholder:text-[#AAA89F] focus:outline-none focus:ring-2 focus:ring-[#1C1B1A]/20 focus:border-[#1C1B1A] transition-all lowercase disabled:opacity-50"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#66645E] flex items-center gap-1 mb-1">
                  <Phone className="w-3 h-3 text-[#88867E]" />
                  <span>Phone Number</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. 9876543210"
                  disabled={loading || isFull}
                  className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-[#E0DDD0] bg-white text-[#1C1B1A] placeholder:text-[#AAA89F] focus:outline-none focus:ring-2 focus:ring-[#1C1B1A]/20 focus:border-[#1C1B1A] transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* College & Branch */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#66645E] flex items-center gap-1 mb-1">
                  <Building className="w-3 h-3 text-[#88867E]" />
                  <span>College</span>
                </label>
                <input
                  type="text"
                  name="college"
                  value={formData.college}
                  onChange={handleChange}
                  placeholder="KIET"
                  disabled={loading || isFull}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-[#E0DDD0] bg-white text-[#1C1B1A] focus:outline-none focus:ring-2 focus:ring-[#1C1B1A]/20 focus:border-[#1C1B1A] transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#66645E] flex items-center gap-1 mb-1">
                  <GraduationCap className="w-3 h-3 text-[#88867E]" />
                  <span>Branch / Dept</span>
                </label>
                <select
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  disabled={loading || isFull}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-[#E0DDD0] bg-white text-[#1C1B1A] focus:outline-none focus:ring-2 focus:ring-[#1C1B1A]/20 focus:border-[#1C1B1A] transition-all cursor-pointer disabled:opacity-50"
                >
                  <option value="CSE">CSE (Computer Science & Engg)</option>
                  <option value="CSM">CSM (AI & Machine Learning)</option>
                  <option value="AID">AID (AI & Data Science)</option>
                  <option value="CAI">CAI (CS & Artificial Intelligence)</option>
                  <option value="IT">IT (Information Technology)</option>
                  <option value="ECE">ECE (Electronics & Comm)</option>
                  <option value="EEE">EEE (Electrical & Electronics)</option>
                  <option value="MECH">MECH (Mechanical Engg)</option>
                  <option value="CIVIL">CIVIL (Civil Engg)</option>
                </select>
              </div>
            </div>

            {/* Role Code & Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#66645E] flex items-center gap-1 mb-1">
                  <UserPlus className="w-3 h-3 text-[#88867E]" />
                  <span>Role / Designation</span>
                </label>
                <select
                  name="roleCode"
                  value={formData.roleCode}
                  onChange={handleChange}
                  disabled={loading || isFull}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-[#E0DDD0] bg-white text-[#1C1B1A] focus:outline-none focus:ring-2 focus:ring-[#1C1B1A]/20 focus:border-[#1C1B1A] transition-all cursor-pointer font-semibold disabled:opacity-50"
                >
                  <option value="JD">JD • Junior Developer (3rd Year)</option>
                  <option value="SD">SD • Senior Developer (4th Year)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#66645E] flex items-center gap-1 mb-1">
                  <Calendar className="w-3 h-3 text-[#88867E]" />
                  <span>Academic Year</span>
                </label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  disabled={loading || isFull}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-[#E0DDD0] bg-white text-[#1C1B1A] focus:outline-none focus:ring-2 focus:ring-[#1C1B1A]/20 focus:border-[#1C1B1A] transition-all cursor-pointer disabled:opacity-50 font-medium"
                >
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>
            </div>

            {/* Residence Type & Active Backlogs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#66645E] flex items-center gap-1 mb-1">
                  <Home className="w-3 h-3 text-[#88867E]" />
                  <span>Residence Type</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  disabled={loading || isFull}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-[#E0DDD0] bg-white text-[#1C1B1A] focus:outline-none focus:ring-2 focus:ring-[#1C1B1A]/20 focus:border-[#1C1B1A] transition-all cursor-pointer disabled:opacity-50"
                >
                  <option value="DS">DS (Day Scholar)</option>
                  <option value="Hostel">Hostel (Hosteler)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#66645E] flex items-center gap-1 mb-1">
                  <AlertCircle className="w-3 h-3 text-[#88867E]" />
                  <span>Active Backlogs</span>
                </label>
                <input
                  type="number"
                  name="backlogs"
                  min="0"
                  max="20"
                  value={formData.backlogs}
                  onChange={handleChange}
                  disabled={loading || isFull}
                  className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-[#E0DDD0] bg-white text-[#1C1B1A] focus:outline-none focus:ring-2 focus:ring-[#1C1B1A]/20 focus:border-[#1C1B1A] transition-all disabled:opacity-50"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-white border-t border-[#E0DDD0] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#E0DDD0] text-[#66645E] hover:bg-[#F2EFE6] transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="add-student-form"
            disabled={loading || isFull}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-[#1C1B1A] text-white hover:bg-black transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Adding Student...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Add Student to Roster</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
