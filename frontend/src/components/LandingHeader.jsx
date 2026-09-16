import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth, getDashboardPath, getRoleName } from '../context/AuthContext';
import { Menu, X, ChevronDown, LogOut, LayoutDashboard, Sparkles, ArrowRight, GraduationCap } from 'lucide-react';
import C4GTLogo from './C4GTLogo';

const NAV_ITEMS = [
  { id: 'about', label: 'About', sectionId: null },
  { id: 'curriculum', label: 'Learning', sectionId: 'curriculum' },
  { id: 'roles', label: 'Teams', sectionId: 'roles' },
  { id: 'features', label: 'Features', sectionId: 'features' },
  { id: 'analytics', label: 'Analytics', sectionId: 'analytics' },
];

export default function LandingHeader() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('about');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      const scrollPosition = window.scrollY + 120;
      if (window.scrollY < 200) {
        setActiveSection('about');
        return;
      }

      for (let i = NAV_ITEMS.length - 1; i >= 0; i--) {
        const item = NAV_ITEMS[i];
        if (item.sectionId) {
          const el = document.getElementById(item.sectionId);
          if (el) {
            const top = el.offsetTop;
            if (scrollPosition >= top - 80) {
              setActiveSection(item.id);
              break;
            }
          }
        }
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

  const handleNavClick = (item) => {
    setActiveSection(item.id);
    setMobileMenuOpen(false);

    if (!item.sectionId) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const el = document.getElementById(item.sectionId);
      if (el) {
        const yOffset = -80;
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
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
        return 'Admin Dashboard';
      case 'teamlead':
      case 'team_lead':
        return 'Team Lead Dashboard';
      case 'user':
      case 'student':
      default:
        return 'Student Dashboard';
    }
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? 'bg-[#F9F8F3]/95 backdrop-blur-xl border-b border-[#E2DDD0] shadow-sm shadow-[#1C1B1A]/5'
          : 'bg-[#F9F8F3]/80 backdrop-blur-md border-b border-[#E6E2D8]/60'
      }`}
    >
      <div className="max-w-[1340px] mx-auto px-6 sm:px-10 h-[78px] flex items-center justify-between gap-4">
        
        {/* BRAND */}
        <Link to="/" className="flex items-center gap-3 group relative flex-shrink-0 hover:opacity-90 transition-opacity">
          <C4GTLogo className="h-10" />
        </Link>

        {/* CENTER MAIN NAVIGATION */}
        <nav className="hidden md:flex items-center gap-1 bg-[#EEECDF]/70 p-1.5 rounded-full border border-[#E0DDD0] backdrop-blur-sm">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className={`relative px-4 py-1.5 text-sm font-medium rounded-full transition-colors cursor-pointer ${
                  isActive ? 'text-[#1C1B1A]' : 'text-[#66645E] hover:text-[#1C1B1A]'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavWarmPill"
                    className="absolute inset-0 bg-white rounded-full border border-black/5 shadow-xs"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
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
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-[#4A4843] hover:text-[#1C1B1A] px-4 py-2 rounded-full hover:bg-black/5 transition-all hidden sm:block cursor-pointer"
              >
                Sign in
              </Link>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGetStarted}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white rounded-full bg-[#1C1B1A] hover:bg-black shadow-xs transition-all cursor-pointer"
              >
                <span>Get started</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              {/* USER PROFILE DROPDOWN */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-black/5 transition-colors cursor-pointer border border-[#E0DDD0] bg-white shadow-2xs"
                  aria-expanded={profileDropdownOpen}
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name || 'User'}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#1C1B1A] text-white flex items-center justify-center text-xs font-bold shadow-inner">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <ChevronDown className={`w-4 h-4 text-[#66645E] transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {profileDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-12 w-64 bg-[#F9F8F3] border border-[#E0DDD0] rounded-2xl shadow-xl p-2 z-50 backdrop-blur-2xl"
                    >
                      <div className="px-3 py-2.5 border-b border-[#E2DDD0]">
                        <p className="text-sm font-bold text-[#1C1B1A] truncate">{user?.name || 'User'}</p>
                        <p className="text-xs text-[#66645E] truncate mt-0.5">{user?.email}</p>
                        <div className="mt-2">
                          <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-[#1C1B1A]/[0.08] text-[#1C1B1A] border border-[#1C1B1A]/10">
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
            </div>
          )}

          {/* MOBILE MENU TOGGLE */}
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden p-2 rounded-full text-[#1C1B1A] hover:bg-black/5 transition-colors focus:outline-none cursor-pointer border border-[#E0DDD0]"
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
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden overflow-hidden bg-[#F9F8F3] border-b border-[#E0DDD0] backdrop-blur-2xl"
          >
            <div className="px-6 py-5 space-y-2">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className={`block w-full text-left px-4 py-2.5 text-sm font-medium rounded-full transition-colors cursor-pointer ${
                    activeSection === item.id
                      ? 'text-[#1C1B1A] bg-white border border-[#E0DDD0] shadow-2xs'
                      : 'text-[#66645E] hover:text-[#1C1B1A] hover:bg-black/5'
                  }`}
                >
                  {item.label}
                </button>
              ))}

              <div className="pt-4 mt-2 border-t border-[#E0DDD0] flex flex-col gap-2.5">
                {!isAuthenticated ? (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full text-center py-2.5 text-sm font-medium text-[#1C1B1A] hover:bg-black/5 rounded-full border border-[#E0DDD0] transition-colors"
                    >
                      Sign in
                    </Link>
                    <button
                      onClick={handleGetStarted}
                      className="w-full py-2.5 text-sm font-medium text-white bg-[#1C1B1A] hover:bg-black rounded-full shadow-xs cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>Get started</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleGetStarted}
                    className="w-full py-2.5 text-sm font-medium text-white bg-[#1C1B1A] hover:bg-black rounded-full shadow-xs cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Go to {getDashboardLabel(user?.role)}</span>
                    <ArrowRight className="w-4 h-4" />
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
