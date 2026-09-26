import React, { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Menu, X, LogOut, ChevronRight } from 'lucide-react';
import UserAvatar from './UserAvatar';

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
      className={`hidden lg:flex lg:flex-col flex-shrink-0 h-screen sticky top-0 overflow-hidden select-none z-30 ${className}`}
      style={style}
      animate={{
        width: animate ? (open ? '260px' : '68px') : '260px',
      }}
      transition={{
        duration: 0.24,
        ease: [0.16, 1, 0.3, 1],
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
            className={`fixed top-0 left-0 z-50 h-screen max-h-screen w-72 max-w-[85vw] flex flex-col lg:hidden shadow-2xl ${className}`}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
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

/* --- Sidebar Link (Fixed height h-11, zero vertical shift) --- */
export function SidebarLink({ link, isActive = false, className = '', onClick }) {
  const { open, animate } = useSidebar();

  return (
    <Link
      to={link.href}
      onClick={onClick}
      title={!open ? link.label : undefined}
      className={`relative flex items-center h-11 px-3 rounded-xl transition-colors duration-150 group cursor-pointer ${
        isActive
          ? 'bg-neutral-800 text-white font-medium shadow-xs'
          : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
      } ${className}`}
    >
      {/* Active Indicator Bar when collapsed */}
      {isActive && !open && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r" />
      )}

      {/* Icon (permanently centered and locked in place) */}
      <span className={`flex-shrink-0 flex items-center justify-center w-6 h-6 transition-colors duration-150 ${isActive ? 'text-white' : 'text-neutral-400 group-hover:text-white'}`}>
        {link.icon}
      </span>

      {/* Animated Label (smooth horizontal reveal, no layout push) */}
      <motion.span
        animate={{
          opacity: animate ? (open ? 1 : 0) : 1,
          x: animate ? (open ? 0 : -6) : 0,
        }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className={`ml-3 text-sm font-medium whitespace-nowrap overflow-hidden leading-none ${!open ? 'pointer-events-none' : ''}`}
      >
        {link.label}
      </motion.span>

      {/* Animated Badge */}
      {link.badge !== undefined && (
        <motion.span
          animate={{
            opacity: animate ? (open ? 1 : 0) : 1,
            scale: animate ? (open ? 1 : 0.8) : 1,
          }}
          transition={{ duration: 0.16 }}
          className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-700/80 text-neutral-200 border border-neutral-600 leading-tight whitespace-nowrap ${!open ? 'pointer-events-none' : ''}`}
        >
          {link.badge}
        </motion.span>
      )}
    </Link>
  );
}

/* --- Brand / Logo Component (Fixed height h-12, locked icon position) --- */
export function SidebarLogo({ logo, className = '' }) {
  const { open, animate } = useSidebar();

  return (
    <Link
      to={logo.href || '/'}
      className={`flex items-center h-12 gap-3 px-1 rounded-xl group transition-colors overflow-hidden ${className}`}
    >
      <span className="flex-shrink-0 flex items-center justify-center w-10 h-10">
        {logo.icon}
      </span>

      <motion.div
        animate={{
          opacity: animate ? (open ? 1 : 0) : 1,
          x: animate ? (open ? 0 : -6) : 0,
        }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className={`flex flex-col min-w-0 overflow-hidden ${!open ? 'pointer-events-none' : ''}`}
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

/* --- Section Label (Constant height h-7, no vertical layout shift) --- */
export function SidebarSectionLabel({ label, className = '' }) {
  const { open, animate } = useSidebar();

  return (
    <div className={`h-7 flex items-center px-3 my-1.5 select-none overflow-hidden ${className}`}>
      {open ? (
        <motion.div
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -4 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-between w-full min-w-0"
        >
          <span className="text-[10px] font-semibold tracking-widest text-neutral-400 uppercase whitespace-nowrap truncate">
            {label}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0 ml-2 animate-pulse" />
        </motion.div>
      ) : (
        <div className="w-full flex items-center justify-center">
          <div className="w-6 h-[1px] bg-neutral-800/80 rounded-full" />
        </div>
      )}
    </div>
  );
}

/* --- User Profile Card at Bottom (Fixed height h-[54px], no layout jumping) --- */
export function SidebarUser({ user, getInitials, onProfileClick, onLogout, className = '' }) {
  const { open, animate } = useSidebar();

  return (
    <div className={`p-2 select-none overflow-hidden ${className}`}>
      <div className="flex items-center h-[54px] gap-2.5 p-1 rounded-xl bg-neutral-800/80 border border-neutral-700/60 transition-colors">
        {/* Avatar with live Blobatar animation filling the box */}
        <button
          type="button"
          onClick={onProfileClick}
          title={`${user?.name || 'User'} - View Profile`}
          className="w-11 h-11 rounded-lg bg-[#1C1B1A] border border-neutral-700/60 flex-shrink-0 hover:border-emerald-500/50 hover:shadow-lg transition-all cursor-pointer shadow-xs flex items-center justify-center overflow-hidden group"
        >
          <UserAvatar
            user={user}
            size="w-full h-full"
            rounded="rounded-lg"
            scale="scale-[1.18]"
            animate="always"
          />
        </button>

        {/* User Info (Smoothly fades in when expanded) */}
        <motion.button
          type="button"
          onClick={onProfileClick}
          animate={{
            opacity: animate ? (open ? 1 : 0) : 1,
            x: animate ? (open ? 0 : -6) : 0,
          }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className={`flex flex-col overflow-hidden text-left hover:opacity-90 transition-opacity cursor-pointer flex-1 min-w-0 ${!open ? 'pointer-events-none' : ''}`}
          title="View & Edit Profile Details"
        >
          <div className="font-semibold text-xs text-white truncate leading-tight w-full">
            {user?.name || 'User Account'}
          </div>
          <div className="text-[10px] text-neutral-400 truncate leading-tight w-full mt-0.5">
            {user?.email || 'user@c4gt.in'}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="inline-block px-1.5 py-0.5 text-[8px] font-bold rounded bg-neutral-700 text-neutral-200 leading-none uppercase">
              {user?.role || 'Portal'}
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
            opacity: animate ? (open ? 1 : 0) : 1,
            scale: animate ? (open ? 1 : 0.8) : 1,
          }}
          transition={{ duration: 0.18 }}
          title="Log out"
          className={`w-8 h-8 rounded-lg hover:bg-neutral-700 text-neutral-400 hover:text-rose-400 flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer ${!open ? 'pointer-events-none' : ''}`}
        >
          <LogOut className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
}