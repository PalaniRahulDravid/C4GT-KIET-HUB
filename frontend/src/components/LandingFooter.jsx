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
      <div className="w-full max-w-[1560px] mx-auto px-6 sm:px-10 lg:px-16 xl:px-20 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-12 border-b border-[#E2DDD0]">
          
          {/* BRAND COLUMN */}
          <div className="md:col-span-5 space-y-4">
            <Link to="/" onClick={() => scrollToSection(null)} className="inline-block hover:opacity-90 transition-opacity">
              <C4GTLogo className="h-10" />
            </Link>
            <p className="text-sm text-[#66645E] leading-relaxed max-w-sm">
              A centralized learning and performance management platform for Junior Developers and Interns at KIET Group of Institutions — connecting ML, DSA, tasks, and team tracking in one place.
            </p>
          </div>

          {/* PLATFORM NAVIGATION */}
          <div className="md:col-span-3 space-y-3">
            <p className="text-xs font-mono font-semibold uppercase tracking-wider text-[#66645E]">Platform</p>
            <ul className="space-y-2 text-sm font-medium text-[#4A4843]">
              <li>
                <button onClick={() => scrollToSection(null)} className="hover:text-[#1C1B1A] transition-colors cursor-pointer">
                  About
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('curriculum')} className="hover:text-[#1C1B1A] transition-colors cursor-pointer">
                  Learning Track
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('roles')} className="hover:text-[#1C1B1A] transition-colors cursor-pointer">
                  Teams & Batches
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('features')} className="hover:text-[#1C1B1A] transition-colors cursor-pointer">
                  Features
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('analytics')} className="hover:text-[#1C1B1A] transition-colors cursor-pointer">
                  Performance Analytics
                </button>
              </li>
            </ul>
          </div>

          {/* ROLES & AUTH */}
          <div className="md:col-span-4 space-y-3">
            <p className="text-xs font-mono font-semibold uppercase tracking-wider text-[#66645E]">Access & Portal</p>
            <ul className="space-y-2 text-sm font-medium text-[#4A4843]">
              <li>
                <Link to="/login" className="hover:text-[#1C1B1A] transition-colors">
                  Sign in / Google OAuth
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-[#1C1B1A] transition-colors">
                  Student Portal
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-[#1C1B1A] transition-colors">
                  Team Lead Dashboard
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-[#1C1B1A] transition-colors">
                  Administrator Portal
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* BOTTOM METADATA */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-[#66645E]">
          <p>© {new Date().getFullYear()} C4GT KIET HUB — KIET Group of Institutions. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Built with precision & care</span>
            <span>•</span>
            <span>Centralized LMS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
