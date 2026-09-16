import React, { useState } from 'react';
import { NavLink, Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, ArrowRight, LogOut, LayoutDashboard, Users, Layers, CheckSquare, Home as HomeIcon, ChevronRight, Award } from 'lucide-react';
import C4GTLogo from '../../components/C4GTLogo';
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
  SidebarLogo,
  SidebarSectionLabel,
  SidebarUser,
} from '../../components/AceternitySidebar';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      name: 'Overview',
      to: '/admin',
      end: true,
      description: 'System stats & quick actions',
      icon: <LayoutDashboard className="w-4.5 h-4.5" />,
    },
    {
      name: 'Manage Users',
      to: '/admin/users',
      description: 'Role RBAC & permissions',
      icon: <Users className="w-4.5 h-4.5" />,
    },
    {
      name: 'Cohort Teams (9)',
      to: '/admin/teams',
      description: '9 Teams & Lead Assignment',
      icon: <Award className="w-4.5 h-4.5" />,
    },
    {
      name: 'Batches',
      to: '/admin/batches',
      description: 'Academic batches & teams',
      icon: <Layers className="w-4.5 h-4.5" />,
    },
    {
      name: 'Next Tasks for Teams',
      to: '/admin/tasks',
      description: 'Milestones & deliverables',
      icon: <CheckSquare className="w-4.5 h-4.5" />,
    },
  ];

  const getPageInfo = () => {
    if (location.pathname === '/admin/users') {
      return { breadcrumb: 'Manage Users', title: 'Manage Users & Permissions' };
    }
    if (location.pathname === '/admin/teams') {
      return { breadcrumb: 'Cohort Teams', title: '9 Cohort Teams & Roster Management' };
    }
    if (location.pathname.startsWith('/admin/batches')) {
      return { breadcrumb: 'Batches', title: 'Batches Workspace' };
    }
    if (location.pathname === '/admin/tasks') {
      return { breadcrumb: 'Tasks', title: 'Next Tasks for Teams' };
    }
    return { breadcrumb: 'Overview', title: 'Admin Dashboard Overview' };
  };

  const getInitials = (name) => {
    if (!name) return 'AD';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const pageInfo = getPageInfo();

  return (
    <div className="w-full min-h-screen lg:h-screen lg:max-h-screen flex bg-[#F7F5EE] font-sans antialiased text-[#1C1B1A] select-none overflow-hidden">
      {/* ==================== ACETERNITY COLLAPSIBLE SIDEBAR ==================== */}
      <Sidebar open={mobileSidebarOpen} setOpen={setMobileSidebarOpen} animate={true}>
        <SidebarBody className="bg-neutral-900 border-r border-neutral-800 h-full flex flex-col justify-between">
          {/* Top: logo + nav */}
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden py-4 px-2">
            {/* Logo */}
            <SidebarLogo
              logo={{
                href: '/admin',
                icon: (
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/10 shadow-xs">
                    <C4GTLogo showText={false} imgClassName="h-7" />
                  </div>
                ),
                label: 'C4GT KIET HUB',
                badge: 'ADMIN',
                sublabel: 'Operations Portal',
              }}
              className="mb-4"
            />

            {/* Section label */}
            <SidebarSectionLabel label="Admin Operations" />

            {/* Nav links */}
            <nav className="mt-2 space-y-1">
              {navItems.map((item) => {
                const isActive = item.end
                  ? location.pathname === item.to
                  : location.pathname.startsWith(item.to);
                return (
                  <SidebarLink
                    key={item.to}
                    link={{
                      href: item.to,
                      label: item.name,
                      icon: (
                        <span className={`w-5 h-5 flex items-center justify-center ${isActive ? 'text-white' : 'text-neutral-400'}`}>
                          {item.icon}
                        </span>
                      ),
                    }}
                    isActive={isActive}
                    onClick={() => setMobileSidebarOpen(false)}
                  />
                );
              })}
            </nav>

            {/* Divider */}
            <div className="mx-2 my-4 border-t border-neutral-800/80" />

            {/* Exit to Main Site */}
            <SidebarLink
              link={{
                href: '/',
                label: 'Exit to Main Site',
                icon: <HomeIcon className="w-5 h-5 text-neutral-400" />,
              }}
              onClick={() => setMobileSidebarOpen(false)}
            />
          </div>

          {/* Bottom: Admin User profile */}
          <SidebarUser
            user={user || { name: 'Admin Account', role: 'admin' }}
            getInitials={getInitials}
            onProfileClick={() => {}}
            onLogout={handleLogout}
          />
        </SidebarBody>
      </Sidebar>

      {/* ==================== MAIN CONTENT AREA ==================== */}
      <div className="flex-1 h-screen flex flex-col overflow-hidden min-w-0">
        {/* Top Sticky Header (~84px) */}
        <header className="h-[84px] bg-[#F9F8F3]/95 backdrop-blur-md border-b border-[#E2DDD0] px-6 sm:px-8 flex items-center justify-between flex-shrink-0 shadow-2xs z-20">
          <div className="flex items-center gap-4">
            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-[#1C1B1A] hover:bg-black/5"
              aria-label="Open sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Breadcrumb + Editorial Page Title */}
            <div>
              <div className="flex items-center gap-2 text-xs text-[#66645E] font-medium mb-1">
                <span>Admin Workspace</span>
                <span className="text-[#9E9C94]">/</span>
                <span className="text-[#1C1B1A] font-semibold">{pageInfo.breadcrumb}</span>
              </div>
              <h1 className="font-['Instrument_Serif',serif] text-2xl sm:text-[28px] lg:text-[30px] font-semibold text-[#1C1B1A] tracking-tight leading-none">
                {pageInfo.title}
              </h1>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Main Site Navigation Link */}
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full text-xs font-medium text-[#1C1B1A] bg-white hover:bg-[#F2EFE6] border border-[#E0DDD0] shadow-2xs transition-colors"
            >
              <HomeIcon className="w-3.5 h-3.5 text-[#66645E]" />
              <span>Main Site</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#66645E]" />
            </Link>
          </div>

        </header>

        {/* Scrollable Body Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scroll bg-[#F7F5EE]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
