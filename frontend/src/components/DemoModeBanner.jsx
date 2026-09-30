import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Users, GraduationCap, LogOut, Eye } from 'lucide-react';

export default function DemoModeBanner() {
  const { isDemo, user, loginAsDemo, logout } = useAuth();
  const navigate = useNavigate();
  const [switching, setSwitching] = useState(false);

  if (!isDemo) return null;

  const currentRole = user?.role ? String(user.role).toLowerCase() : 'student';

  const handleRoleSwitch = async (targetRole, targetPath) => {
    if (switching) return;
    try {
      setSwitching(true);
      await loginAsDemo(targetRole);
      navigate(targetPath);
    } catch (err) {
      console.error('Failed to switch role:', err);
    } finally {
      setSwitching(false);
    }
  };

  const handleExit = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="w-full bg-[#1C1B1A] text-[#E0DDD0] border-b border-[#2E2C29] px-3 sm:px-5 py-2 sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
        {/* Top / Left Row on Mobile: Preview Badge & Exit Button */}
        <div className="flex items-center justify-between sm:justify-start gap-2.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#2B2927] text-white text-[11px] font-medium border border-[#3E3B38]">
              <Eye className="w-3.5 h-3.5 text-[#D2CEBE]" />
              <span>Preview Mode</span>
            </span>
            <span className="text-[#8C887B] hidden md:inline text-xs">
              Viewing the application as an evaluator.
            </span>
          </div>

          {/* Exit Button on Mobile (aligned to the right so it never overflows) */}
          <button
            type="button"
            onClick={handleExit}
            className="sm:hidden px-2 py-1 rounded-md bg-[#2B2927] hover:bg-[#353230] text-[#D2CEBE] hover:text-white text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer border border-[#3E3B38]"
            title="Exit preview"
          >
            <LogOut className="w-3 h-3 text-[#A19D94]" />
            <span>Exit</span>
          </button>
        </div>

        {/* Role Switcher & Desktop Exit Button */}
        <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
          {/* 3 Role Switchers: Grid on Mobile, Flex on Desktop */}
          <div className="grid grid-cols-3 sm:flex items-center gap-1.5 w-full sm:w-auto">
            {/* Admin Switch */}
            <button
              type="button"
              disabled={switching || currentRole === 'admin'}
              onClick={() => handleRoleSwitch('admin', '/admin/dashboard')}
              className={`py-1 px-2 sm:px-2.5 rounded-md text-[11px] sm:text-xs font-medium transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer text-center ${
                currentRole === 'admin'
                  ? 'bg-white text-[#1C1B1A] font-semibold shadow-2xs'
                  : 'text-[#A19D94] hover:text-white hover:bg-[#2B2927]'
              }`}
              title="Switch to Admin"
            >
              <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Admin</span>
            </button>

            {/* Team Lead Switch */}
            <button
              type="button"
              disabled={switching || currentRole === 'teamlead' || currentRole === 'team_lead'}
              onClick={() => handleRoleSwitch('teamlead', '/teamlead')}
              className={`py-1 px-2 sm:px-2.5 rounded-md text-[11px] sm:text-xs font-medium transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer text-center whitespace-nowrap ${
                currentRole === 'teamlead' || currentRole === 'team_lead'
                  ? 'bg-white text-[#1C1B1A] font-semibold shadow-2xs'
                  : 'text-[#A19D94] hover:text-white hover:bg-[#2B2927]'
              }`}
              title="Switch to Team Lead"
            >
              <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Team Lead</span>
            </button>

            {/* Student Switch */}
            <button
              type="button"
              disabled={switching || currentRole === 'student' || currentRole === 'user'}
              onClick={() => handleRoleSwitch('student', '/student')}
              className={`py-1 px-2 sm:px-2.5 rounded-md text-[11px] sm:text-xs font-medium transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer text-center ${
                currentRole === 'student' || currentRole === 'user'
                  ? 'bg-white text-[#1C1B1A] font-semibold shadow-2xs'
                  : 'text-[#A19D94] hover:text-white hover:bg-[#2B2927]'
              }`}
              title="Switch to Student"
            >
              <GraduationCap className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Student</span>
            </button>
          </div>

          <div className="h-3.5 w-px bg-[#3E3B38] mx-1 hidden sm:block" />

          {/* Desktop Exit Button */}
          <button
            type="button"
            onClick={handleExit}
            className="hidden sm:flex px-2.5 py-1 rounded-md bg-[#2B2927] hover:bg-[#353230] text-[#D2CEBE] hover:text-white text-xs font-medium transition-colors items-center gap-1.5 cursor-pointer border border-[#3E3B38] whitespace-nowrap"
            title="Exit preview and go to login"
          >
            <LogOut className="w-3 h-3 text-[#A19D94]" />
            <span>Exit</span>
          </button>
        </div>
      </div>
    </div>
  );
}
