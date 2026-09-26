import { Navigate, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth, getDashboardPath, getRoleName } from '../context/AuthContext';
import LandingHeader from '../components/LandingHeader';
import LandingFooter from '../components/LandingFooter';
import {
  ArrowRight,
  GraduationCap,
  Users,
  ShieldCheck,
  CheckCircle2,
  Code2,
  GitBranch,
  BookOpen,
  Flame,
  Clock,
  Layers,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Check,
  FolderGit2,
  MessageSquareCheck,
} from 'lucide-react';

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();


  const handlePrimaryAction = () => {
    if (isAuthenticated) {
      navigate(getDashboardPath(user?.role));
    } else {
      navigate('/login');
    }
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -80;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-[#F9F8F3] text-[#1C1B1A] font-sans antialiased min-h-screen selection:bg-[#1C1B1A] selection:text-white flex flex-col">
      {/* HEADER */}
      <LandingHeader />

      <main className="flex-1 w-full">
        {/* ======================================================== */}
        {/* HERO SECTION                                             */}
        {/* ======================================================== */}
        <section className="relative overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-24 border-b border-[#E2DDD0]">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-96 pointer-events-none opacity-40">
            <div className="absolute top-10 left-1/4 w-80 h-80 rounded-full bg-[#E3EFE1] blur-3xl" />
            <div className="absolute top-10 right-1/4 w-80 h-80 rounded-full bg-[#FBE5DC] blur-3xl" />
          </div>

          <div className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* Campus & Cohort Tag */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EEECDF] border border-[#E0DDD0] text-xs font-mono font-medium text-[#4A4843] mb-6 shadow-2xs"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>KIET Group of Institutions</span>
              <span className="text-[#9E9C94]">•</span>
              <span className="text-[#1C1B1A] font-semibold">C4GT Hub Batch 2026–2027</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#1C1B1A] max-w-4xl mx-auto leading-[1.15]"
            >
              The Central Workspace for <br className="hidden sm:inline" />
              <span className="text-[#1C1B1A]">C4GT KIET Innovation Hub</span>
            </motion.h1>

            {/* Sub-headline */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-5 text-sm sm:text-lg text-[#66645E] max-w-2xl mx-auto font-normal leading-relaxed px-2 sm:px-0"
            >
              Coordinate C4GT HUB teams, deliver project milestones, submit GitHub pull requests, and access curated technical resources — all in one unified portal.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto"
            >
              <button
                onClick={handlePrimaryAction}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 sm:px-7 py-3 text-xs sm:text-sm font-semibold text-white rounded-full bg-[#1C1B1A] hover:bg-black shadow-xs transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
              >
                <span>
                  {isAuthenticated
                    ? `Open Your Workspace (${getRoleName(user?.role)})`
                    : 'Sign In with Roll Number'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => scrollToSection('workspaces')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-[#1C1B1A] rounded-full bg-white hover:bg-neutral-50 border border-[#D5D0C2] shadow-2xs transition-all cursor-pointer"
              >
                <span>Explore Workspaces</span>
              </button>
            </motion.div>

            {/* 3 Pillar Summary Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-4 text-left"
            >
              <div className="bg-[#FDFCF9] rounded-2xl p-5 border border-[#E0DDD0] shadow-2xs flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#EEECDF] text-[#1C1B1A] flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1C1B1A]">9 C4GT HUB Teams</h3>
                  <p className="text-xs text-[#66645E] mt-1 leading-relaxed">
                    Organized squads of junior developers, senior developers, and interns under dedicated student leads.
                  </p>
                </div>
              </div>

              <div className="bg-[#FDFCF9] rounded-2xl p-5 border border-[#E0DDD0] shadow-2xs flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#EEECDF] text-[#1C1B1A] flex items-center justify-center flex-shrink-0">
                  <GitBranch className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1C1B1A]">Milestone Deliverables</h3>
                  <p className="text-xs text-[#66645E] mt-1 leading-relaxed">
                    Submit GitHub repos, pull requests, documentation, and live demo links with deadline tracking.
                  </p>
                </div>
              </div>

              <div className="bg-[#FDFCF9] rounded-2xl p-5 border border-[#E0DDD0] shadow-2xs flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#EEECDF] text-[#1C1B1A] flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1C1B1A]">Curated Resource Hub</h3>
                  <p className="text-xs text-[#66645E] mt-1 leading-relaxed">
                    Centralized technical documentation, study guides, problem sheets, and Cloudinary-stored files.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* WORKSPACES BY ROLE                                       */}
        {/* ======================================================== */}
        <section id="workspaces" className="py-16 sm:py-20 bg-[#F4F1E8] border-b border-[#E2DDD0]">
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#66645E]">
                Tailored for every participant
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1C1B1A] mt-2 tracking-tight">
                Three Focused Workspaces
              </h2>
              <p className="text-xs sm:text-sm text-[#66645E] mt-2">
                Each member gets an optimized workspace tailored specifically to their responsibilities in C4GT.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* STUDENT WORKSPACE */}
              <div className="bg-[#FDFCF9] rounded-2xl p-6 sm:p-7 border border-[#E0DDD0] shadow-2xs flex flex-col justify-between hover:border-[#1C1B1A]/30 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-mono font-bold uppercase px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                      Students & Interns
                    </span>
                    <GraduationCap className="w-5 h-5 text-blue-600" />
                  </div>

                  <h3 className="text-lg font-bold text-[#1C1B1A]">Student Workspace</h3>
                  <p className="text-xs text-[#66645E] mt-1 leading-relaxed">
                    The daily home for Junior Developers, Senior Developers, and Developer Interns to build and learn.
                  </p>

                  <div className="mt-6 space-y-2.5 border-t border-[#E8E4DA] pt-5">
                    <div className="flex items-start gap-2.5 text-xs text-[#4A4843]">
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>View assigned tasks from Admins and Team Leads</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-[#4A4843]">
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>Submit GitHub repository, PR links & documentation</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-[#4A4843]">
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>Access curated technical resources & study notes</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-[#4A4843]">
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>Track daily streak counter & activity heartbeat</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-[#4A4843]">
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>Accept C4GT HUB team invitations & view team roster</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-5 border-t border-[#E8E4DA]">
                  <Link
                    to="/student"
                    className="inline-flex items-center justify-between w-full text-xs font-semibold text-[#1C1B1A] hover:text-blue-600 transition-colors group cursor-pointer"
                  >
                    <span>Go to Student Workspace</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* TEAM LEAD WORKSPACE */}
              <div className="bg-[#FDFCF9] rounded-2xl p-6 sm:p-7 border border-[#E0DDD0] shadow-2xs flex flex-col justify-between hover:border-[#1C1B1A]/30 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-mono font-bold uppercase px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Team Leads (Teams 1–9)
                    </span>
                    <Users className="w-5 h-5 text-emerald-600" />
                  </div>

                  <h3 className="text-lg font-bold text-[#1C1B1A]">Team Lead Portal</h3>
                  <p className="text-xs text-[#66645E] mt-1 leading-relaxed">
                    Designed for student leads to manage their squad roster, assign tasks, and mentor team members.
                  </p>

                  <div className="mt-6 space-y-2.5 border-t border-[#E8E4DA] pt-5">
                    <div className="flex items-start gap-2.5 text-xs text-[#4A4843]">
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>Manage team roster of up to 9 C4GT HUB team members</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-[#4A4843]">
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>Invite students to team and monitor responses</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-[#4A4843]">
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>Create and assign tasks to members or full team</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-[#4A4843]">
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>Review student submissions & provide review feedback</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-[#4A4843]">
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>Dual access: complete personal student tasks seamlessly</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-5 border-t border-[#E8E4DA]">
                  <Link
                    to="/teamlead"
                    className="inline-flex items-center justify-between w-full text-xs font-semibold text-[#1C1B1A] hover:text-emerald-700 transition-colors group cursor-pointer"
                  >
                    <span>Go to Team Lead Portal</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* ADMIN WORKSPACE */}
              <div className="bg-[#FDFCF9] rounded-2xl p-6 sm:p-7 border border-[#E0DDD0] shadow-2xs flex flex-col justify-between hover:border-[#1C1B1A]/30 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-mono font-bold uppercase px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                      Administrators
                    </span>
                    <ShieldCheck className="w-5 h-5 text-purple-600" />
                  </div>

                  <h3 className="text-lg font-bold text-[#1C1B1A]">Administrator Console</h3>
                  <p className="text-xs text-[#66645E] mt-1 leading-relaxed">
                    Centralized platform governance for mentors and admins overseeing academic batches and teams.
                  </p>

                  <div className="mt-6 space-y-2.5 border-t border-[#E8E4DA] pt-5">
                    <div className="flex items-start gap-2.5 text-xs text-[#4A4843]">
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>Initialize academic batches & 9 C4GT HUB team layouts</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-[#4A4843]">
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>User Management & RBAC (Student, Lead, Admin)</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-[#4A4843]">
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>Publish C4GT HUB team tasks, priorities & deadlines</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-[#4A4843]">
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>Cloudinary-backed centralized resource hub</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-[#4A4843]">
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>Review task submissions & evaluate team analytics</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-5 border-t border-[#E8E4DA]">
                  <Link
                    to="/admin"
                    className="inline-flex items-center justify-between w-full text-xs font-semibold text-[#1C1B1A] hover:text-purple-700 transition-colors group cursor-pointer"
                  >
                    <span>Go to Admin Console</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* HOW C4GT KIET HUB WORKS                                  */}
        {/* ======================================================== */}
        <section id="workflow" className="py-16 sm:py-20 bg-[#F9F8F3] border-b border-[#E2DDD0]">
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#66645E]">
                Operational Flow
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1C1B1A] mt-2 tracking-tight">
                How C4GT KIET Hub Operates
              </h2>
              <p className="text-xs sm:text-sm text-[#66645E] mt-2">
                A simple four-step workflow connecting students to real-world open source and software milestones.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* STEP 1 */}
              <div className="bg-[#FDFCF9] rounded-2xl p-6 border border-[#E0DDD0] shadow-2xs relative">
                <span className="text-2xl font-mono font-bold text-[#D5D0C2]">01</span>
                <h3 className="text-sm font-bold text-[#1C1B1A] mt-3">Roll Number Access</h3>
                <p className="text-xs text-[#66645E] mt-1.5 leading-relaxed">
                  Sign in with your official KIET roll number. Complete your profile details (branch, year, and developer type).
                </p>
              </div>

              {/* STEP 2 */}
              <div className="bg-[#FDFCF9] rounded-2xl p-6 border border-[#E0DDD0] shadow-2xs relative">
                <span className="text-2xl font-mono font-bold text-[#D5D0C2]">02</span>
                <h3 className="text-sm font-bold text-[#1C1B1A] mt-3">Squad Assignment</h3>
                <p className="text-xs text-[#66645E] mt-1.5 leading-relaxed">
                  Join one of the 9 designated batch teams, collaborate with peers, and receive guidance from your Team Lead.
                </p>
              </div>

              {/* STEP 3 */}
              <div className="bg-[#FDFCF9] rounded-2xl p-6 border border-[#E0DDD0] shadow-2xs relative">
                <span className="text-2xl font-mono font-bold text-[#D5D0C2]">03</span>
                <h3 className="text-sm font-bold text-[#1C1B1A] mt-3">Build & Submit Code</h3>
                <p className="text-xs text-[#66645E] mt-1.5 leading-relaxed">
                  Tackle active task assignments and submit GitHub pull requests, repository links, documentation, or demos.
                </p>
              </div>

              {/* STEP 4 */}
              <div className="bg-[#FDFCF9] rounded-2xl p-6 border border-[#E0DDD0] shadow-2xs relative">
                <span className="text-2xl font-mono font-bold text-[#D5D0C2]">04</span>
                <h3 className="text-sm font-bold text-[#1C1B1A] mt-3">Review & Daily Streaks</h3>
                <p className="text-xs text-[#66645E] mt-1.5 leading-relaxed">
                  Leads and Admins review submissions with feedback. Keep your daily heartbeat active to maintain your learning streak.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* PLATFORM CAPABILITIES                                    */}
        {/* ======================================================== */}
        <section id="features" className="py-16 sm:py-20 bg-[#F4F1E8] border-b border-[#E2DDD0]">
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#66645E]">
                Practical Capabilities
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1C1B1A] mt-2 tracking-tight">
                Built For Engineering Accountability
              </h2>
              <p className="text-xs sm:text-sm text-[#66645E] mt-2">
                Everything required for smooth project execution and mentor review without unnecessary friction.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Feature 1 */}
              <div className="bg-[#FDFCF9] rounded-2xl p-6 sm:p-7 border border-[#E0DDD0] shadow-2xs flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center flex-shrink-0">
                  <FolderGit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1C1B1A]">GitHub Deliverables & Links</h3>
                  <p className="text-xs text-[#66645E] mt-1 leading-relaxed">
                    Direct form inputs for GitHub repository URLs, pull request links, live application endpoints, and technical documentation. Clear deadline indicators prevent overdue deliverables.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="bg-[#FDFCF9] rounded-2xl p-6 sm:p-7 border border-[#E0DDD0] shadow-2xs flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1C1B1A]">Multi-Format Resource Library</h3>
                  <p className="text-xs text-[#66645E] mt-1 leading-relaxed">
                    Filter learning resources by type: PDF guides, spreadsheets, problem sets, repository templates, and external links with Cloudinary asset storage and download tracking.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="bg-[#FDFCF9] rounded-2xl p-6 sm:p-7 border border-[#E0DDD0] shadow-2xs flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center flex-shrink-0">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1C1B1A]">Daily Heartbeat & Streak System</h3>
                  <p className="text-xs text-[#66645E] mt-1 leading-relaxed">
                    Encourages continuous discipline through automatic attendance heartbeats and consecutive day streak counts visible in each student's overview.
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="bg-[#FDFCF9] rounded-2xl p-6 sm:p-7 border border-[#E0DDD0] shadow-2xs flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                  <MessageSquareCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1C1B1A]">Submission Evaluation & Feedback</h3>
                  <p className="text-xs text-[#66645E] mt-1 leading-relaxed">
                    Team leads and admins can review submissions, mark them as approved or requested revision, and attach written notes so students know where to iterate.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* BOTTOM CTA BANNER                                        */}
        {/* ======================================================== */}
        <section className="py-14 sm:py-16 bg-[#FDFCF9] border-b border-[#E2DDD0]">
          <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEECDF] text-xs font-mono font-semibold text-[#4A4843] mb-4">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>C4GT KIET Hub Access</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1C1B1A] tracking-tight">
              Ready to access your workspace?
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#66645E] max-w-lg mx-auto">
              Sign in using your KIET college Roll Number and password to access your team tasks, resources, and submissions.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handlePrimaryAction}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white rounded-full bg-[#1C1B1A] hover:bg-black shadow-xs transition-all cursor-pointer hover:scale-[1.01]"
              >
                <span>
                  {isAuthenticated
                    ? `Continue to ${getRoleName(user?.role)} Workspace`
                    : 'Sign In with Roll Number'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#4A4843] hover:text-[#1C1B1A] rounded-full border border-[#D5D0C2] bg-white transition-all cursor-pointer"
              >
                <span>Back to Top</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <LandingFooter />
    </div>
  );
}
