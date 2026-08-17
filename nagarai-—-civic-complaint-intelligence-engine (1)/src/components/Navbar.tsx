import React from 'react';
import nagarAiLogo from '../assets/images/nagar_ai_logo_1786970773414.jpg';
import { 
  Building2, 
  Layers, 
  MapPin, 
  Radio, 
  Calculator, 
  ShieldCheck, 
  Bell, 
  FileText,
  RotateCcw,
  Zap,
  LogOut,
  Shield
} from 'lucide-react';
import { MasterCluster, CitizenNotification, OfficerNotification } from '../types';

interface NavbarProps {
  activeTab: 'dashboard' | 'benchmark' | 'formula' | 'robustness';
  setActiveTab: (tab: 'dashboard' | 'benchmark' | 'formula' | 'robustness') => void;
  clusters: MasterCluster[];
  notifications?: CitizenNotification[];
  officerNotifications?: OfficerNotification[];
  onOpenNotifications: () => void;
  onResetData: () => void;
  userRole?: 'citizen' | 'officer' | null;
  officerUser?: { name: string; phone: string; department?: string };
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  clusters,
  notifications = [],
  officerNotifications = [],
  onOpenNotifications,
  onResetData,
  userRole = 'officer',
  officerUser,
  onLogout,
}) => {
  const pendingCount = clusters.filter((c) => c.status === 'pending' || c.status === 'dispatched').length;
  const criticalCount = clusters.filter((c) => c.priorityScore >= 130 && c.status !== 'resolved').length;
  const totalAffected = clusters.reduce((acc, c) => acc + c.affectedCitizenCount, 0);
  const notificationCount = userRole === 'officer' ? officerNotifications.length : notifications.length;

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-xl">
      {/* Top Civic Status Banner */}
      <div className="bg-gradient-to-r from-emerald-900/60 via-slate-900 to-indigo-900/60 px-4 py-1.5 text-xs flex flex-wrap items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            Greater Chennai &amp; Bengaluru Municipal Live Grid
          </span>
          <span className="hidden md:inline text-slate-400">|</span>
          <span className="hidden md:inline text-slate-300">
            Ward Cluster Engine Active • <span className="text-amber-300 font-medium">{totalAffected} Citizens Protected</span>
          </span>
        </div>
        <div className="flex items-center gap-4 text-slate-300">
          {criticalCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-medium text-[11px] border border-rose-500/30">
              <Zap className="w-3 h-3 text-rose-400 animate-pulse" />
              {criticalCount} Critical Life Hazard{criticalCount > 1 ? 's' : ''}
            </span>
          )}
          <button
            onClick={onResetData}
            title="Reset system to default seed state"
            className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors text-[11px] cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Demo
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Officer Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-500 via-sky-500 to-emerald-500 p-0.5 shadow-md flex items-center justify-center shrink-0">
              <img 
                src={nagarAiLogo} 
                alt="NagarAI Logo" 
                className="w-full h-full object-cover rounded-[10px]"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-emerald-300 to-teal-200">
                  NagarAI
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Officer Dashboard
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Role: Officer
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                {officerUser ? `${officerUser.name} • ${officerUser.department || 'Municipal Division'}` : 'Civic Complaint Intelligence & Deduplication Engine'}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Layers className="w-4 h-4" />
              Official War Room
              {pendingCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/60 text-sky-200 font-bold">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('benchmark')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'benchmark'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Radio className="w-4 h-4 text-amber-300 animate-pulse" />
              15-Complaint Judge Suite
            </button>

            <button
              onClick={() => setActiveTab('formula')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'formula'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Calculator className="w-4 h-4 text-indigo-400" />
              Explainable Math
            </button>

            <button
              onClick={() => setActiveTab('robustness')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'robustness'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              Robustness Lab
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            {/* Notification Drawer Button */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              title={userRole === 'officer' ? "Municipal Command & Officer Operational Alerts" : "Citizen SMS / WhatsApp Alerts"}
            >
              <Bell className="w-5 h-5 text-indigo-300" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center animate-bounce">
                  {notificationCount}
                </span>
              )}
            </button>

            {/* Logout Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:border-rose-700/60 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-rose-300 transition-all cursor-pointer"
                title="Switch Role / Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-800 scrollbar-none">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'dashboard' ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-300'
            }`}
          >
            War Room ({pendingCount})
          </button>
          <button
            onClick={() => setActiveTab('benchmark')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'benchmark' ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-300'
            }`}
          >
            15-Complaint Judge Test
          </button>
          <button
            onClick={() => setActiveTab('formula')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'formula' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-300'
            }`}
          >
            Formula Math
          </button>
          <button
            onClick={() => setActiveTab('robustness')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'robustness' ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-300'
            }`}
          >
            Robustness Lab
          </button>
        </div>
      </div>
    </header>
  );
};
