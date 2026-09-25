import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth, getDashboardPath, getRoleName } from '../context/AuthContext';
import { Menu, X, ChevronDown, LogOut, LayoutDashboard, ArrowRight, GraduationCap, ShieldCheck } from 'lucide-react';
import C4GTLogo from './C4GTLogo';
import UserAvatar from './UserAvatar';

const NAV_ITEMS = [
  { id: 'workspaces', label: 'Workspaces', sectionId: 'workspaces' },
  { id: 'workflow', label: 'How It Works', sectionId: 'workflow' },
  { id: 'features', label: 'Capabilities', sectionId: 'features' },
];

export default function LandingHeader() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      const scrollPosition = window.scrollY + 120;
      for (let i = NAV_ITEMS.length - 1; i >= 0; i--) {
        const item = NAV_ITEMS[i];
        if (item.sectionId) {
          const el = document.getElementById(item.sectionId);
          if (el) {
            const top = el.offsetTop;
            if (scrollPosition >= top - 80) {
              setActiveSection(item.id);
              return;
            }
          }
        }
      }
      if (window.scrollY < 200) {
        setActiveSection('');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (sectionId) => {
    setMobileMenuOpen(false);
    if (!sectionId) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(sectionId);
    if (el) {
      const yOffset = -80;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handleGetStarted = () => {
    setMobileMenuOpen(false);
    if (isAuthenticated) {
      navigate(getDashboardPath(user?.role));
    } else {
      navigate('/login');
    }
  };

  const getDashboardLabel = (role) => {
    switch (role) {
      case 'admin':
        return 'Admin Console';
      case 'teamlead':
      case 'team_lead':
        return 'Team Lead Portal';
      case 'user':
      case 'student':
      default:
        return 'Student Workspace';
    }
  };

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? 'bg-[#F9F8F3]/95 backdrop-blur-md border-b border-[#E2DDD0] shadow-xs'
          : 'bg-[#F9F8F3]/90 backdrop-blur-sm border-b border-[#E8E4DA]'
      }`}
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between gap-4">
        
        {/* BRAND LOGO */}
        <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-3 group flex-shrink-0">
          <C4GTLogo className="h-10" />
        </Link>

        {/* NAVIGATION PILLS */}
        <nav className="hidden md:flex items-center gap-1 bg-[#EEECDF]/80 p-1 rounded-full border border-[#E0DDD0]">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.sectionId)}
                className={`relative px-4 py-1.5 text-xs font-semibold rounded-full transition-colors cursor-pointer ${
                  isActive ? 'text-[#1C1B1A]' : 'text-[#66645E] hover:text-[#1C1B1A]'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavPill"
                    className="absolute inset-0 bg-white rounded-full border border-black/5 shadow-2xs"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* RIGHT ACTIONS */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {!isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#1C1B1A] bg-white border border-[#D5D0C2] rounded-full hover:bg-neutral-50 shadow-2xs transition-all cursor-pointer"
              >
                <span>Sign In</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#66645E]" />
              </Link>
            </div>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2.5 p-1 rounded-full hover:bg-black/5 transition-colors cursor-pointer border border-[#E0DDD0] bg-white shadow-2xs"
                aria-expanded={profileDropdownOpen}
              >
                <UserAvatar user={user} size="w-8 h-8" rounded="rounded-full" animate="always" />
                <span className="text-xs font-medium text-[#1C1B1A] max-w-[100px] truncate hidden sm:inline pr-1">
                  {user?.name || 'Account'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-[#66645E] transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {profileDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 w-64 bg-[#FDFCF9] border border-[#E0DDD0] rounded-2xl shadow-xl p-2 z-50"
                  >
                    <div className="px-3 py-2.5 border-b border-[#E8E4DA]">
                      <p className="text-sm font-bold text-[#1C1B1A] truncate">{user?.name || 'User'}</p>
                      <p className="text-xs text-[#66645E] truncate mt-0.5">{user?.email}</p>
                      {user?.rollNumber && (
                        <p className="text-[11px] font-mono font-medium text-[#4A4843] mt-1">
                          Roll: {user.rollNumber}
                        </p>
                      )}
                      <div className="mt-1.5">
                        <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-[#1C1B1A]/[0.07] text-[#1C1B1A] border border-[#1C1B1A]/10">
                          {getRoleName(user?.role)}
                        </span>
                      </div>
                    </div>

                    <div className="py-1.5 space-y-1">
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          navigate(getDashboardPath(user?.role));
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#1C1B1A] hover:bg-black/5 rounded-xl transition-colors text-left cursor-pointer"
                      >
                        <LayoutDashboard className="w-4 h-4 text-[#1C1B1A]" />
                        <span>{getDashboardLabel(user?.role)}</span>
                      </button>

                      {(user?.role === 'teamlead' || user?.role === 'team_lead') && (
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            navigate('/student');
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#1C1B1A] hover:bg-black/5 rounded-xl transition-colors text-left cursor-pointer"
                        >
                          <GraduationCap className="w-4 h-4 text-blue-600" />
                          <span>Student Workspace</span>
                        </button>
                      )}

                      {user?.role === 'admin' && (
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            navigate('/admin');
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#1C1B1A] hover:bg-black/5 rounded-xl transition-colors text-left cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4 text-purple-600" />
                          <span>Admin Console</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* MOBILE TOGGLE */}
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden p-2 rounded-xl text-[#1C1B1A] hover:bg-black/5 transition-colors focus:outline-none cursor-pointer border border-[#E0DDD0]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden bg-[#F9F8F3] border-b border-[#E0DDD0]"
          >
            <div className="px-5 py-4 space-y-2">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.sectionId)}
                  className="block w-full text-left px-4 py-2.5 text-xs font-semibold text-[#4A4843] hover:text-[#1C1B1A] hover:bg-black/5 rounded-xl transition-colors cursor-pointer"
                >
                  {item.label}
                </button>
              ))}

              <div className="pt-3 border-t border-[#E0DDD0]">
                {!isAuthenticated ? (
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center py-2.5 text-xs font-semibold text-white bg-[#1C1B1A] rounded-xl shadow-2xs"
                  >
                    Sign In with Roll Number
                  </Link>
                ) : (
                  <button
                    onClick={handleGetStarted}
                    className="w-full py-2.5 text-xs font-semibold text-white bg-[#1C1B1A] rounded-xl shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Open {getDashboardLabel(user?.role)}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
