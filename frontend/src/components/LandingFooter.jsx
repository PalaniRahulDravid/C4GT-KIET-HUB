import React from 'react';
import { Link } from 'react-router-dom';
import C4GTLogo from './C4GTLogo';

export default function LandingFooter() {
  const scrollToSection = (id) => {
    if (!id) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const el = document.getElementById(id);
      if (el) {
        const yOffset = -80;
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
  };

  return (
    <footer className="bg-[#F2EFE6] border-t border-[#E2DDD0] text-[#1C1B1A]">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-[#E2DDD0]">
          
          {/* BRAND COLUMN */}
          <div className="md:col-span-6 space-y-3">
            <Link to="/" onClick={() => scrollToSection(null)} className="inline-block hover:opacity-90 transition-opacity">
              <C4GTLogo className="h-9" />
            </Link>
            <p className="text-xs text-[#66645E] leading-relaxed max-w-md">
              C4GT KIET HUB is the dedicated internal workspace for Code 4 GovTech at KIET Group of Institutions. Connecting student developers, cohort teams, project milestones, and resources in one platform.
            </p>
            <div className="inline-flex items-center gap-2 text-[11px] font-mono font-medium text-[#4A4843] bg-white/70 px-2.5 py-1 rounded-md border border-[#E0DDD0]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              <span>Active Cohort: Batch 2026–2027</span>
            </div>
          </div>

          {/* WORKSPACES */}
          <div className="md:col-span-3 space-y-2.5">
            <p className="text-xs font-mono font-semibold uppercase tracking-wider text-[#66645E]">Workspaces</p>
            <ul className="space-y-1.5 text-xs font-medium text-[#4A4843]">
              <li>
                <Link to="/student" className="hover:text-[#1C1B1A] transition-colors">
                  Student & Intern Workspace
                </Link>
              </li>
              <li>
                <Link to="/teamlead" className="hover:text-[#1C1B1A] transition-colors">
                  Team Lead Portal
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-[#1C1B1A] transition-colors">
                  Administrator Console
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-[#1C1B1A] transition-colors">
                  Roll Number Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* QUICK SECTIONS */}
          <div className="md:col-span-3 space-y-2.5">
            <p className="text-xs font-mono font-semibold uppercase tracking-wider text-[#66645E]">Platform</p>
            <ul className="space-y-1.5 text-xs font-medium text-[#4A4843]">
              <li>
                <button onClick={() => scrollToSection('workspaces')} className="hover:text-[#1C1B1A] transition-colors cursor-pointer">
                  Role Portals
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('workflow')} className="hover:text-[#1C1B1A] transition-colors cursor-pointer">
                  How It Works
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('features')} className="hover:text-[#1C1B1A] transition-colors cursor-pointer">
                  Key Capabilities
                </button>
              </li>
              <li>
                <Link to="/login" className="hover:text-[#1C1B1A] transition-colors">
                  Account Access
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* BOTTOM METADATA */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#66645E]">
          <p>© {new Date().getFullYear()} C4GT KIET HUB — KIET Group of Institutions. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>KIET Group of Institutions</span>
            <span>•</span>
            <span>Internal Portal</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
