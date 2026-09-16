import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth, getDashboardPath } from '../context/AuthContext';
import LandingHeader from '../components/LandingHeader';
import LandingFooter from '../components/LandingFooter';
import {
  ArrowRight,
  Sparkles,
  BookOpen,
  Code2,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  Award,
  Layers,
  ChevronRight,
  Target,
  BarChart2,
  GraduationCap,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Batch selector state
  const [selectedBatch, setSelectedBatch] = useState('2026-2027');

  const handleGetStarted = () => {
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

  // Sample analytics data for Recharts
  const taskStatusData = [
    { name: 'Completed', value: 142, color: '#1C1B1A' },
    { name: 'In Progress', value: 45, color: '#66645E' },
    { name: 'Pending Review', value: 24, color: '#9E9C94' },
    { name: 'Overdue', value: 8, color: '#DC2626' },
  ];

  const teamPerformanceData = [
    { team: 'Team 1', completion: 92 },
    { team: 'Team 2', completion: 88 },
    { team: 'Team 3', completion: 84 },
    { team: 'Team 4', completion: 79 },
    { team: 'Team 5', completion: 76 },
    { team: 'Team 6', completion: 72 },
  ];

  // Teams mock data per batch
  const batchTeamsData = {
    '2026-2027': [
      { id: 1, name: 'Team Alpha', lead: 'Aarav Sharma', members: 6, completion: 92, tasksDone: 28, totalTasks: 30 },
      { id: 2, name: 'Team Beta', lead: 'Ananya Gupta', members: 5, completion: 88, tasksDone: 26, totalTasks: 30 },
      { id: 3, name: 'Team Gamma', lead: 'Rohan Verma', members: 6, completion: 84, tasksDone: 25, totalTasks: 30 },
      { id: 4, name: 'Team Delta', lead: 'Ishita Patel', members: 5, completion: 79, tasksDone: 23, totalTasks: 29 },
      { id: 5, name: 'Team Epsilon', lead: 'Kabir Singh', members: 6, completion: 76, tasksDone: 22, totalTasks: 29 },
      { id: 6, name: 'Team Zeta', lead: 'Meera Rao', members: 5, completion: 72, tasksDone: 21, totalTasks: 29 },
    ],
    '2027-2028': [
      { id: 1, name: 'Team Orion', lead: 'Devansh Kumar', members: 6, completion: 95, tasksDone: 19, totalTasks: 20 },
      { id: 2, name: 'Team Nebula', lead: 'Sanya Malhotra', members: 5, completion: 90, tasksDone: 18, totalTasks: 20 },
      { id: 3, name: 'Team Pulsar', lead: 'Aditya Roy', members: 6, completion: 85, tasksDone: 17, totalTasks: 20 },
      { id: 4, name: 'Team Zenith', lead: 'Riya Sen', members: 5, completion: 80, tasksDone: 16, totalTasks: 20 },
    ],
  };

  return (
    <div className="bg-[#F9F8F3] text-[#1C1B1A] font-sans antialiased min-h-screen selection:bg-[#1C1B1A] selection:text-white">
      {/* HEADER */}
      <LandingHeader />

      <main className="w-full">
        {/* ========================================== */}
        {/* 1. HERO SECTION                            */}
        {/* ========================================== */}
        <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32 bg-gradient-to-b from-[#EBF3EA]/50 via-[#F8F6F0] to-[#FCEEE9]/40 border-b border-[#E2DDD0]">
          {/* Subtle Ambient Background Light */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none opacity-60">
            <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-[#E3EFE1] blur-3xl" />
            <div className="absolute top-20 right-10 w-96 h-96 rounded-full bg-[#FBE5DC] blur-3xl" />
          </div>

          <div className="relative max-w-[1340px] mx-auto px-6 sm:px-10 flex flex-col items-center text-center">
            


            {/* Editorial Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-['Instrument_Serif',serif] text-5xl sm:text-7xl md:text-8xl font-normal tracking-tight leading-[1.04] text-[#1C1B1A] max-w-4xl"
            >
              Build Skills.<br />
              <span className="italic font-light">Build the Future.</span>
            </motion.h1>

            {/* Sub-headline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-8 text-lg sm:text-xl text-[#66645E] max-w-2xl font-normal leading-relaxed"
            >
              A centralized learning and performance platform for C4GT KIET HUB — connecting Machine Learning, DSA, tasks, teams, and progress in one place.
            </motion.p>

            {/* Hero Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-10 flex flex-wrap items-center justify-center gap-4"
            >
              <button
                onClick={handleGetStarted}
                className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 text-base font-medium text-white rounded-full bg-[#1C1B1A] hover:bg-black shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
              >
                <span>{isAuthenticated ? 'Go to Dashboard' : 'Get started'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => scrollToSection('curriculum')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-medium text-[#1C1B1A] rounded-full bg-white/90 hover:bg-white border border-black/10 shadow-2xs transition-all cursor-pointer hover:scale-[1.01]"
              >
                <span>Explore Learning</span>
              </button>
            </motion.div>

            {/* ========================================== */}
            {/* 2. HERO PRODUCT VISUAL                     */}
            {/* ========================================== */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-16 w-full max-w-5xl rounded-2xl bg-[#FDFCF9] border border-[#E0DDD0] shadow-2xl shadow-[#1C1B1A]/8 p-4 sm:p-6 relative overflow-hidden"
            >
              {/* Product Frame Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#EBE8DC]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#E5807B]/80" />
                  <div className="w-3 h-3 rounded-full bg-[#F4C56B]/80" />
                  <div className="w-3 h-3 rounded-full bg-[#75C284]/80" />
                  <span className="ml-3 text-xs font-mono text-[#66645E]">c4gt-kiet-hub.internal/overview</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-[#66645E]">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Batch 2026-2027 Active</span>
                </div>
              </div>

              {/* Product Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-b border-[#EBE8DC]">
                <div className="text-left px-3">
                  <p className="text-xs font-mono uppercase tracking-wider text-[#66645E]">Students</p>
                  <p className="text-3xl font-bold text-[#1C1B1A] mt-1">48</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">Active Learners</p>
                </div>
                <div className="text-left px-3">
                  <p className="text-xs font-mono uppercase tracking-wider text-[#66645E]">Active Tasks</p>
                  <p className="text-3xl font-bold text-[#1C1B1A] mt-1">32</p>
                  <p className="text-[11px] text-[#66645E] mt-0.5">ML & DSA Modules</p>
                </div>
                <div className="text-left px-3">
                  <p className="text-xs font-mono uppercase tracking-wider text-[#66645E]">Completion</p>
                  <p className="text-3xl font-bold text-[#1C1B1A] mt-1">78%</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">+12% this week</p>
                </div>
                <div className="text-left px-3">
                  <p className="text-xs font-mono uppercase tracking-wider text-[#66645E]">Teams</p>
                  <p className="text-3xl font-bold text-[#1C1B1A] mt-1">9</p>
                  <p className="text-[11px] text-[#66645E] mt-0.5">Batch 2026-2027</p>
                </div>
              </div>

              {/* Product Live Demo Content */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-6 text-left">
                {/* Active Tasks Widget */}
                <div className="md:col-span-7 bg-[#F7F5EE] rounded-xl p-4 border border-[#E0DDD0]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-semibold text-[#1C1B1A]">CURRENT CURRICULUM TASKS</span>
                    <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-[#E0DDD0]">Priority</span>
                  </div>
                  <div className="space-y-2.5">
                    <div className="p-3 bg-white rounded-lg border border-black/5 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#1C1B1A]">PyTorch Model Training & Loss Curves</p>
                        <p className="text-xs text-[#66645E]">Machine Learning Track • Due in 2 days</p>
                      </div>
                      <span className="text-xs font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                        88% Done
                      </span>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-black/5 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#1C1B1A]">Dynamic Programming: Knapsack & Grid Paths</p>
                        <p className="text-xs text-[#66645E]">DSA Track • Due in 4 days</p>
                      </div>
                      <span className="text-xs font-mono font-medium text-[#1C1B1A] bg-[#EEECDF] px-2 py-1 rounded border border-[#E0DDD0]">
                        65% Done
                      </span>
                    </div>
                  </div>
                </div>

                {/* Team Standings Widget */}
                <div className="md:col-span-5 bg-[#F7F5EE] rounded-xl p-4 border border-[#E0DDD0] flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-mono font-semibold text-[#1C1B1A]">TEAM STANDINGS</span>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#1C1B1A]">1. Team Alpha (6 members)</span>
                        <span className="font-mono text-emerald-700 font-bold">92%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[#E0DDD0] overflow-hidden">
                        <div className="h-full bg-[#1C1B1A] rounded-full" style={{ width: '92%' }} />
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="font-semibold text-[#1C1B1A]">2. Team Beta (5 members)</span>
                        <span className="font-mono text-[#1C1B1A] font-bold">88%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[#E0DDD0] overflow-hidden">
                        <div className="h-full bg-[#66645E] rounded-full" style={{ width: '88%' }} />
                      </div>
                    </div>
                  </div>
                  <div className="pt-3 text-[11px] text-[#66645E] border-t border-[#E0DDD0] flex items-center justify-between mt-3">
                    <span>Updated 5m ago</span>
                    <span className="font-semibold text-[#1C1B1A]">View All Teams →</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ========================================== */}
        {/* 3. ABOUT SECTION                           */}
        {/* ========================================== */}
        <section className="py-24 bg-[#F9F8F3] border-b border-[#E2DDD0]">
          <div className="max-w-[1340px] mx-auto px-6 sm:px-10">
            <div className="max-w-3xl">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#66645E]">About C4GT KIET HUB</span>
              <h2 className="font-['Instrument_Serif',serif] text-4xl sm:text-6xl font-normal text-[#1C1B1A] leading-[1.1] mt-3">
                Learning should have a place to move forward.
              </h2>
              <p className="mt-6 text-lg text-[#66645E] leading-relaxed">
                C4GT KIET HUB brings learning resources, tasks, deadlines, and performance tracking into one centralized platform for Junior Developers and Interns at KIET Group of Institutions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              <div className="bg-[#F2EFE6] rounded-2xl p-8 border border-[#E0DDD0] space-y-4">
                <div className="w-10 h-10 rounded-xl bg-[#1C1B1A] text-white flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-[#1C1B1A]">01. LEARN</h3>
                <p className="text-sm text-[#66645E] leading-relaxed">
                  Access structured notes, curated learning materials, and official reference links for ML and DSA.
                </p>
              </div>

              <div className="bg-[#F2EFE6] rounded-2xl p-8 border border-[#E0DDD0] space-y-4">
                <div className="w-10 h-10 rounded-xl bg-[#1C1B1A] text-white flex items-center justify-center">
                  <Code2 className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-[#1C1B1A]">02. PRACTICE</h3>
                <p className="text-sm text-[#66645E] leading-relaxed">
                  Complete real DSA problem sets and Machine Learning projects with enforced submission deadlines.
                </p>
              </div>

              <div className="bg-[#F2EFE6] rounded-2xl p-8 border border-[#E0DDD0] space-y-4">
                <div className="w-10 h-10 rounded-xl bg-[#1C1B1A] text-white flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-[#1C1B1A]">03. GROW</h3>
                <p className="text-sm text-[#66645E] leading-relaxed">
                  Track progress individually and as a team with transparent analytics for students and team leads.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* 4. LEARNING SECTION                        */}
        {/* ========================================== */}
        <section id="curriculum" className="py-24 bg-[#F4F1E8] border-b border-[#E2DDD0]">
          <div className="max-w-[1340px] mx-auto px-6 sm:px-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
              <div>
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#66645E]">Curriculum Tracks</span>
                <h2 className="font-['Instrument_Serif',serif] text-4xl sm:text-6xl font-normal text-[#1C1B1A] leading-[1.1] mt-2">
                  Structured tracks for modern developers.
                </h2>
              </div>
              <p className="text-sm text-[#66645E] max-w-md">
                Designed to bridge foundational Computer Science concepts with practical industry engineering skills.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* ML TRACK CARD */}
              <div className="bg-[#F9F8F3] rounded-2xl p-8 sm:p-10 border border-[#E0DDD0] shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xs font-mono font-semibold uppercase px-3 py-1 rounded-full bg-[#1C1B1A] text-white">
                      Track 01
                    </span>
                    <span className="text-xs font-mono text-[#66645E]">18 Core Modules</span>
                  </div>

                  <h3 className="font-['Instrument_Serif',serif] text-3xl sm:text-4xl text-[#1C1B1A]">
                    Machine Learning & AI
                  </h3>
                  <p className="mt-3 text-sm text-[#66645E] leading-relaxed">
                    Master modern predictive modeling, deep learning architectures, dataset preprocessing, and model evaluation metrics.
                  </p>

                  <div className="mt-8 space-y-3">
                    <div className="p-3.5 rounded-xl bg-[#F2EFE6] border border-[#E0DDD0] flex items-center justify-between text-sm">
                      <span className="font-medium text-[#1C1B1A]">Supervised Learning & Regression</span>
                      <span className="text-xs font-mono text-[#66645E]">4 Tasks</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#F2EFE6] border border-[#E0DDD0] flex items-center justify-between text-sm">
                      <span className="font-medium text-[#1C1B1A]">Neural Networks & PyTorch Fundamentals</span>
                      <span className="text-xs font-mono text-[#66645E]">6 Tasks</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#F2EFE6] border border-[#E0DDD0] flex items-center justify-between text-sm">
                      <span className="font-medium text-[#1C1B1A]">Model Evaluation & Confusion Matrix</span>
                      <span className="text-xs font-mono text-[#66645E]">3 Tasks</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-[#E0DDD0] flex items-center justify-between">
                  <span className="text-xs font-mono text-[#66645E]">Progress: 84% Completed</span>
                  <button onClick={handleGetStarted} className="text-sm font-semibold text-[#1C1B1A] hover:underline flex items-center gap-1 cursor-pointer">
                    <span>View Track</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* DSA TRACK CARD */}
              <div className="bg-[#F9F8F3] rounded-2xl p-8 sm:p-10 border border-[#E0DDD0] shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xs font-mono font-semibold uppercase px-3 py-1 rounded-full bg-[#1C1B1A] text-white">
                      Track 02
                    </span>
                    <span className="text-xs font-mono text-[#66645E]">24 Core Modules</span>
                  </div>

                  <h3 className="font-['Instrument_Serif',serif] text-3xl sm:text-4xl text-[#1C1B1A]">
                    DSA & Problem Solving
                  </h3>
                  <p className="mt-3 text-sm text-[#66645E] leading-relaxed">
                    Build rigorous algorithmic problem-solving capabilities, memory optimization, and algorithmic time complexity analysis.
                  </p>

                  <div className="mt-8 space-y-3">
                    <div className="p-3.5 rounded-xl bg-[#F2EFE6] border border-[#E0DDD0] flex items-center justify-between text-sm">
                      <span className="font-medium text-[#1C1B1A]">Arrays, HashMaps & Sliding Window</span>
                      <span className="text-xs font-mono text-[#66645E]">8 Tasks</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#F2EFE6] border border-[#E0DDD0] flex items-center justify-between text-sm">
                      <span className="font-medium text-[#1C1B1A]">Trees, Graphs & BFS/DFS Traversal</span>
                      <span className="text-xs font-mono text-[#66645E]">10 Tasks</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#F2EFE6] border border-[#E0DDD0] flex items-center justify-between text-sm">
                      <span className="font-medium text-[#1C1B1A]">Dynamic Programming & Greedy Algorithms</span>
                      <span className="text-xs font-mono text-[#66645E]">6 Tasks</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-[#E0DDD0] flex items-center justify-between">
                  <span className="text-xs font-mono text-[#66645E]">Progress: 76% Completed</span>
                  <button onClick={handleGetStarted} className="text-sm font-semibold text-[#1C1B1A] hover:underline flex items-center gap-1 cursor-pointer">
                    <span>View Track</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* 5. TEAMS & BATCHES SECTION                 */}
        {/* ========================================== */}
        <section id="roles" className="py-24 bg-[#F9F8F3] border-b border-[#E2DDD0]">
          <div className="max-w-[1340px] mx-auto px-6 sm:px-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div>
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#66645E]">Academic Batches & Teams</span>
                <h2 className="font-['Instrument_Serif',serif] text-4xl sm:text-6xl font-normal text-[#1C1B1A] leading-[1.1] mt-2">
                  Organized cohort management.
                </h2>
              </div>

              {/* Batch Switcher Pills */}
              <div className="inline-flex p-1.5 bg-[#EEECDF] rounded-full border border-[#E0DDD0]">
                <button
                  onClick={() => setSelectedBatch('2026-2027')}
                  className={`px-5 py-2 text-xs font-mono font-semibold rounded-full transition-all cursor-pointer ${
                    selectedBatch === '2026-2027'
                      ? 'bg-[#1C1B1A] text-white shadow-xs'
                      : 'text-[#66645E] hover:text-[#1C1B1A]'
                  }`}
                >
                  Batch 2026–2027
                </button>
                <button
                  onClick={() => setSelectedBatch('2027-2028')}
                  className={`px-5 py-2 text-xs font-mono font-semibold rounded-full transition-all cursor-pointer ${
                    selectedBatch === '2027-2028'
                      ? 'bg-[#1C1B1A] text-white shadow-xs'
                      : 'text-[#66645E] hover:text-[#1C1B1A]'
                  }`}
                >
                  Batch 2027–2028
                </button>
              </div>
            </div>

            {/* Teams Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {batchTeamsData[selectedBatch].map((team) => (
                <div
                  key={team.id}
                  className="bg-[#F2EFE6] rounded-2xl p-6 border border-[#E0DDD0] hover:border-[#1C1B1A]/30 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-mono font-bold uppercase text-[#1C1B1A]">
                        {team.name}
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        {team.completion}%
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-[#66645E]">
                      <p>
                        <strong className="text-[#1C1B1A]">Team Lead:</strong> {team.lead}
                      </p>
                      <p>
                        <strong className="text-[#1C1B1A]">Members:</strong> {team.members} Students
                      </p>
                      <p>
                        <strong className="text-[#1C1B1A]">Tasks Completed:</strong> {team.tasksDone} / {team.totalTasks}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#E0DDD0]">
                    <div className="w-full h-1.5 bg-[#E0DDD0] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1C1B1A] rounded-full"
                        style={{ width: `${team.completion}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* 6. FEATURES SECTION                        */}
        {/* ========================================== */}
        <section id="features" className="py-24 bg-[#F4F1E8] border-b border-[#E2DDD0]">
          <div className="max-w-[1340px] mx-auto px-6 sm:px-10">
            <div className="max-w-2xl mb-16">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#66645E]">Platform Features</span>
              <h2 className="font-['Instrument_Serif',serif] text-4xl sm:text-6xl font-normal text-[#1C1B1A] leading-[1.1] mt-2">
                Everything needed to ship thoughtful software.
              </h2>
            </div>

            {/* Alternating Feature Rows */}
            <div className="space-y-16">
              {/* Feature 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-5 space-y-4">
                  <span className="text-xs font-mono font-semibold text-[#66645E]">01 / RESOURCES & NOTES</span>
                  <h3 className="font-['Instrument_Serif',serif] text-3xl sm:text-4xl text-[#1C1B1A]">
                    Centralized Learning Materials
                  </h3>
                  <p className="text-sm text-[#66645E] leading-relaxed">
                    Store structured notes, lecture slides, video tutorials, and curated reference documentation. All accessible by students in a single dashboard.
                  </p>
                </div>
                <div className="lg:col-span-7 bg-[#F9F8F3] rounded-2xl p-6 sm:p-8 border border-[#E0DDD0] shadow-sm">
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-white border border-black/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-5 h-5 text-[#1C1B1A]" />
                        <div>
                          <p className="text-sm font-semibold text-[#1C1B1A]">PyTorch Autograd & Backpropagation Reference</p>
                          <p className="text-xs text-[#66645E]">Official PyTorch Docs • Added by Admin</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-[#66645E]">PDF Link</span>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-black/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Code2 className="w-5 h-5 text-[#1C1B1A]" />
                        <div>
                          <p className="text-sm font-semibold text-[#1C1B1A]">NeetCode 150 DSA Roadmap & Solutions</p>
                          <p className="text-xs text-[#66645E]">Problem Solving Track • Curated List</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-[#66645E]">Repository</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-7 lg:order-1 order-2 bg-[#F9F8F3] rounded-2xl p-6 sm:p-8 border border-[#E0DDD0] shadow-sm">
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-white border border-black/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-amber-600" />
                        <div>
                          <p className="text-sm font-semibold text-[#1C1B1A]">Assignment #4: Convolutional Neural Nets</p>
                          <p className="text-xs text-[#66645E]">Deadline: Friday, 11:59 PM</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded">
                        Due in 2 days
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-black/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <div>
                          <p className="text-sm font-semibold text-[#1C1B1A]">Assignment #3: Graph Traversal Algorithms</p>
                          <p className="text-xs text-[#66645E]">Completed on Sept 10</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded">
                        Submitted
                      </span>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-5 lg:order-2 order-1 space-y-4">
                  <span className="text-xs font-mono font-semibold text-[#66645E]">02 / TASK MANAGEMENT</span>
                  <h3 className="font-['Instrument_Serif',serif] text-3xl sm:text-4xl text-[#1C1B1A]">
                    Strict Deadlines & Task Tracking
                  </h3>
                  <p className="text-sm text-[#66645E] leading-relaxed">
                    Assign next tasks to teams with clear deadlines. Students submit code links and track approval status seamlessly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* 7. PERFORMANCE / ANALYTICS SECTION         */}
        {/* ========================================== */}
        <section id="analytics" className="py-24 bg-[#F9F8F3] border-b border-[#E2DDD0]">
          <div className="max-w-[1340px] mx-auto px-6 sm:px-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
              <div>
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#66645E]">Performance Analytics</span>
                <h2 className="font-['Instrument_Serif',serif] text-4xl sm:text-6xl font-normal text-[#1C1B1A] leading-[1.1] mt-2">
                  Data-driven insights for teams and admins.
                </h2>
              </div>
              <p className="text-sm text-[#66645E] max-w-md">
                Transparent metrics ensuring no student or team lags behind in their learning goals.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* BAR CHART */}
              <div className="lg:col-span-7 bg-[#F2EFE6] rounded-2xl p-6 sm:p-8 border border-[#E0DDD0]">
                <h3 className="text-lg font-bold text-[#1C1B1A] mb-2">Team Completion Comparison</h3>
                <p className="text-xs text-[#66645E] mb-6">Percentage of assigned tasks completed across active teams</p>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={teamPerformanceData}>
                      <XAxis dataKey="team" stroke="#66645E" fontSize={12} tickLine={false} />
                      <YAxis stroke="#66645E" fontSize={12} tickLine={false} domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: '#1C1B1A', color: '#FFF', borderRadius: '8px', border: 'none' }} />
                      <Bar dataKey="completion" fill="#1C1B1A" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* PIE CHART / BREAKDOWN */}
              <div className="lg:col-span-5 bg-[#F2EFE6] rounded-2xl p-6 sm:p-8 border border-[#E0DDD0] flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#1C1B1A] mb-2">Overall Task Status</h3>
                  <p className="text-xs text-[#66645E] mb-4">Total tasks distribution across Batch 2026-2027</p>

                  <div className="h-48 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={taskStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4}>
                          {taskStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1C1B1A', color: '#FFF', borderRadius: '8px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#E0DDD0]">
                  {taskStatusData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs font-medium text-[#1C1B1A]">{item.name}: <strong>{item.value}</strong></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* 8. HOW IT WORKS                            */}
        {/* ========================================== */}
        <section className="py-24 bg-[#F4F1E8] border-b border-[#E2DDD0]">
          <div className="max-w-[1340px] mx-auto px-6 sm:px-10">
            <div className="max-w-2xl mb-16">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#66645E]">Workflow</span>
              <h2 className="font-['Instrument_Serif',serif] text-4xl sm:text-6xl font-normal text-[#1C1B1A] leading-[1.1] mt-2">
                How C4GT KIET HUB works.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-[#F9F8F3] rounded-2xl p-8 border border-[#E0DDD0]">
                <span className="font-['Instrument_Serif',serif] text-6xl text-[#1C1B1A]/20 font-light">01</span>
                <h3 className="text-xl font-bold text-[#1C1B1A] mt-4">Admin Publishes Content</h3>
                <p className="text-sm text-[#66645E] leading-relaxed mt-2">
                  Administrators create academic batches, assign team leads, upload ML/DSA resources, and publish task modules with deadlines.
                </p>
              </div>

              <div className="bg-[#F9F8F3] rounded-2xl p-8 border border-[#E0DDD0]">
                <span className="font-['Instrument_Serif',serif] text-6xl text-[#1C1B1A]/20 font-light">02</span>
                <h3 className="text-xl font-bold text-[#1C1B1A] mt-4">Students Learn & Submit</h3>
                <p className="text-sm text-[#66645E] leading-relaxed mt-2">
                  Students access learning resources, study topic modules, solve DSA/ML problems, and submit repository/code links.
                </p>
              </div>

              <div className="bg-[#F9F8F3] rounded-2xl p-8 border border-[#E0DDD0]">
                <span className="font-['Instrument_Serif',serif] text-6xl text-[#1C1B1A]/20 font-light">03</span>
                <h3 className="text-xl font-bold text-[#1C1B1A] mt-4">Leads Track & Mentor</h3>
                <p className="text-sm text-[#66645E] leading-relaxed mt-2">
                  Team Leads monitor team progress, review member submissions, guide struggling students, and report overall batch performance.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* 9. ROLE SECTION                            */}
        {/* ========================================== */}
        <section className="py-24 bg-[#F9F8F3] border-b border-[#E2DDD0]">
          <div className="max-w-[1340px] mx-auto px-6 sm:px-10">
            <div className="max-w-2xl mb-16">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#66645E]">Role Viewports</span>
              <h2 className="font-['Instrument_Serif',serif] text-4xl sm:text-6xl font-normal text-[#1C1B1A] leading-[1.1] mt-2">
                Designed for every participant.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* ADMIN */}
              <div className="bg-[#F2EFE6] rounded-2xl p-8 border border-[#E0DDD0] flex flex-col justify-between">
                <div>
                  <span className="text-xs font-mono font-semibold uppercase px-3 py-1 rounded-full bg-[#1C1B1A] text-white">
                    Administrator
                  </span>
                  <h3 className="text-2xl font-bold text-[#1C1B1A] mt-6">Full Control & Oversight</h3>
                  <ul className="mt-4 space-y-2 text-sm text-[#66645E]">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1C1B1A]" />
                      <span>Manage users & role assignments</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1C1B1A]" />
                      <span>Create academic batches & teams</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1C1B1A]" />
                      <span>Publish tasks & learning resources</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* TEAM LEAD */}
              <div className="bg-[#F2EFE6] rounded-2xl p-8 border border-[#E0DDD0] flex flex-col justify-between">
                <div>
                  <span className="text-xs font-mono font-semibold uppercase px-3 py-1 rounded-full bg-[#1C1B1A] text-white">
                    Team Lead
                  </span>
                  <h3 className="text-2xl font-bold text-[#1C1B1A] mt-6">Team Mentorship</h3>
                  <ul className="mt-4 space-y-2 text-sm text-[#66645E]">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1C1B1A]" />
                      <span>Monitor team completion rates</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1C1B1A]" />
                      <span>Track individual member tasks</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1C1B1A]" />
                      <span>Guide & review student submissions</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* STUDENT */}
              <div className="bg-[#F2EFE6] rounded-2xl p-8 border border-[#E0DDD0] flex flex-col justify-between">
                <div>
                  <span className="text-xs font-mono font-semibold uppercase px-3 py-1 rounded-full bg-[#1C1B1A] text-white">
                    Student / Intern
                  </span>
                  <h3 className="text-2xl font-bold text-[#1C1B1A] mt-6">Active Learning</h3>
                  <ul className="mt-4 space-y-2 text-sm text-[#66645E]">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1C1B1A]" />
                      <span>Access ML & DSA learning notes</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1C1B1A]" />
                      <span>Complete assigned tasks before deadline</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1C1B1A]" />
                      <span>Track personal progress dashboard</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* 10. CTA SECTION                            */}
        {/* ========================================== */}
        <section className="py-28 bg-gradient-to-tr from-[#EBF3EA] via-[#F8F6F0] to-[#FCEEE9] border-b border-[#E2DDD0] relative overflow-hidden">
          <div className="max-w-[1340px] mx-auto px-6 sm:px-10 text-center relative z-10">
            <h2 className="font-['Instrument_Serif',serif] text-5xl sm:text-7xl font-normal text-[#1C1B1A] leading-[1.05]">
              Ready to build what's next?
            </h2>
            <p className="mt-6 text-lg sm:text-xl text-[#66645E] max-w-xl mx-auto font-normal">
              Learn together. Practice consistently. Grow as a team.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={handleGetStarted}
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 text-base font-medium text-white rounded-full bg-[#1C1B1A] hover:bg-black shadow-md transition-all cursor-pointer hover:scale-[1.01]"
              >
                <span>{isAuthenticated ? 'Go to Dashboard' : 'Get started'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollToSection('curriculum')}
                className="inline-flex items-center justify-center gap-2 px-7 py-4 text-base font-medium text-[#1C1B1A] rounded-full bg-white hover:bg-white/90 border border-black/10 shadow-2xs transition-all cursor-pointer"
              >
                <span>Explore Learning</span>
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
