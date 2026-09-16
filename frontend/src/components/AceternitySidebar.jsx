import React, { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Menu, X, LogOut, ChevronRight } from 'lucide-react';

/* --- Context --- */
const SidebarContext = createContext(null);

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used inside <SidebarProvider>');
  return ctx;
}

export function SidebarProvider({ children, open: openProp, setOpen: setOpenProp, animate = true }) {
  const [openState, setOpenState] = useState(false);
  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
}

/* --- Root Sidebar --- */
export function Sidebar({ children, open, setOpen, animate = true }) {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
}

/* --- Sidebar Body --- */
export function SidebarBody({ children, className = '', style = {} }) {
  return (
    <>
      <DesktopSidebar className={className} style={style}>
        {children}
      </DesktopSidebar>
      <MobileSidebar className={className}>
        {children}
      </MobileSidebar>
    </>
  );
}

/* --- Desktop Sidebar (Ultra-smooth expand on hover) --- */
function DesktopSidebar({ children, className = '', style = {} }) {
  const { open, setOpen, animate } = useSidebar();

  return (
    <motion.aside
      className={`hidden lg:flex lg:flex-col flex-shrink-0 h-full overflow-hidden select-none z-30 ${className}`}
      style={style}
      animate={{
        width: animate ? (open ? '260px' : '68px') : '260px',
      }}
      transition={{
        duration: 0.22,
        ease: [0.25, 0.1, 0.25, 1.0],
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {children}
    </motion.aside>
  );
}

/* --- Mobile Sidebar (Slide-over drawer) --- */
function MobileSidebar({ children, className = '' }) {
  const { open, setOpen } = useSidebar();

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="sidebar-overlay"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
          />

          {/* Drawer */}
          <motion.aside
            key="sidebar-drawer"
            className={`fixed top-0 left-0 z-50 h-full w-72 flex flex-col lg:hidden shadow-2xl ${className}`}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1.0] }}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer z-20"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>

            {children}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/* --- Sidebar Link --- */
export function SidebarLink({ link, isActive = false, className = '', onClick }) {
  const { open, animate } = useSidebar();

  return (
    <Link
      to={link.href}
      onClick={onClick}
      title={!open ? link.label : undefined}
      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-150 group cursor-pointer ${
        isActive
          ? 'bg-neutral-800 text-white font-medium shadow-xs'
          : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
      } ${className}`}
    >
      {/* Active Indicator Bar when collapsed */}
      {isActive && !open && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r" />
      )}

      {/* Icon */}
      <span className={`flex-shrink-0 flex items-center justify-center w-5 h-5 transition-colors duration-150 ${isActive ? 'text-white' : 'text-neutral-400 group-hover:text-white'}`}>
        {link.icon}
      </span>

      {/* Animated Label */}
      <motion.span
        animate={{
          display: animate ? (open ? 'inline-block' : 'none') : 'inline-block',
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        transition={{ duration: 0.16 }}
        className="text-sm font-medium whitespace-nowrap overflow-hidden leading-none"
      >
        {link.label}
      </motion.span>

      {/* Animated Badge */}
      {link.badge !== undefined && (
        <motion.span
          animate={{
            display: animate ? (open ? 'inline-flex' : 'none') : 'inline-flex',
            opacity: animate ? (open ? 1 : 0) : 1,
          }}
          transition={{ duration: 0.14 }}
          className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-700/80 text-neutral-200 border border-neutral-600 leading-tight whitespace-nowrap"
        >
          {link.badge}
        </motion.span>
      )}
    </Link>
  );
}

/* --- Brand / Logo Component --- */
export function SidebarLogo({ logo, className = '' }) {
  const { open, animate } = useSidebar();

  return (
    <Link
      to={logo.href || '/'}
      className={`flex items-center gap-3 px-1 py-1 rounded-xl group transition-colors overflow-hidden ${className}`}
    >
      <span className="flex-shrink-0 flex items-center justify-center w-10 h-10">
        {logo.icon}
      </span>

      <motion.div
        animate={{
          display: animate ? (open ? 'flex' : 'none') : 'flex',
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        transition={{ duration: 0.16 }}
        className="flex-col min-w-0 overflow-hidden"
      >
        <div className="flex items-center gap-2">
          <span className="font-bold text-white text-[15px] tracking-tight whitespace-nowrap leading-tight">
            {logo.label}
          </span>
          {logo.badge && (
            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-white text-neutral-900 tracking-wider">
              {logo.badge}
            </span>
          )}
        </div>
        {logo.sublabel && (
          <span className="text-[11px] text-neutral-400 truncate leading-tight mt-0.5">
            {logo.sublabel}
          </span>
        )}
      </motion.div>
    </Link>
  );
}

/* --- Section Label --- */
export function SidebarSectionLabel({ label, className = '' }) {
  const { open, animate } = useSidebar();

  return (
    <motion.div
      animate={{
        display: animate ? (open ? 'flex' : 'none') : 'flex',
        opacity: animate ? (open ? 1 : 0) : 1,
      }}
      transition={{ duration: 0.14 }}
      className={`items-center justify-between px-3 py-1.5 mt-3 mb-1 select-none overflow-hidden ${className}`}
    >
      <span className="text-[10px] font-semibold tracking-widest text-neutral-400 uppercase whitespace-nowrap">
        {label}
      </span>
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
    </motion.div>
  );
}

/* --- User Profile Card at Bottom (No Layout Jumping) --- */
export function SidebarUser({ user, getInitials, onProfileClick, onLogout, className = '' }) {
  const { open, animate } = useSidebar();

  return (
    <div className={`p-2 select-none overflow-hidden ${className}`}>
      <div className="flex items-center gap-2.5 p-1.5 rounded-xl bg-neutral-800/80 border border-neutral-700/60 transition-colors">
        {/* Avatar (Stable, never remounts or moves abruptly) */}
        <button
          type="button"
          onClick={onProfileClick}
          title={`${user?.name || 'Student'} - View Profile`}
          className="w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-xs border border-neutral-700 flex-shrink-0 hover:border-neutral-500 transition-colors cursor-pointer shadow-xs"
        >
          {getInitials ? getInitials(user?.name) : 'ST'}
        </button>

        {/* User Info (Smoothly fades in when expanded) */}
        <motion.button
          type="button"
          onClick={onProfileClick}
          animate={{
            display: animate ? (open ? 'flex' : 'none') : 'flex',
            opacity: animate ? (open ? 1 : 0) : 1,
          }}
          transition={{ duration: 0.16 }}
          className="flex-col overflow-hidden text-left hover:opacity-90 transition-opacity cursor-pointer flex-1 min-w-0"
          title="View & Edit Profile Details"
        >
          <div className="font-semibold text-xs text-white truncate leading-tight w-full">
            {user?.name || 'Student Account'}
          </div>
          <div className="text-[10px] text-neutral-400 truncate leading-tight w-full mt-0.5">
            {user?.email || 'student@c4gt.in'}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            {(user?.role === 'teamlead' || user?.role === 'team_lead') && (
              <span className="inline-block px-1.5 py-0.5 text-[8px] font-bold rounded bg-emerald-900/80 text-emerald-300 border border-emerald-700 leading-none">
                LEAD
              </span>
            )}
            <span className="inline-block px-1.5 py-0.5 text-[8px] font-semibold rounded bg-neutral-700 text-neutral-300 leading-none">
              STUDENT
            </span>
            <span className="text-[9px] text-neutral-300 underline font-medium hover:text-white leading-none">
              Profile
            </span>
          </div>
        </motion.button>

        {/* Logout Button (Smoothly fades in when expanded) */}
        <motion.button
          type="button"
          onClick={onLogout}
          animate={{
            display: animate ? (open ? 'flex' : 'none') : 'flex',
            opacity: animate ? (open ? 1 : 0) : 1,
          }}
          transition={{ duration: 0.16 }}
          title="Log out"
          className="w-8 h-8 rounded-lg hover:bg-neutral-700 text-neutral-400 hover:text-rose-400 items-center justify-center transition-colors flex-shrink-0 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
}