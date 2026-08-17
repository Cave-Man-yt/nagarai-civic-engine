import React, { useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  Flame, 
  AlertTriangle, 
  Truck, 
  CheckCircle2, 
  Clock, 
  Layers, 
  ExternalLink, 
  Award, 
  ShieldCheck, 
  Sparkles,
  Zap,
  Building,
  UserCheck,
  ChevronRight
} from 'lucide-react';
import { OfficerNotification, OfficerQualification, MasterCluster } from '../types';
import { OFFICER_QUALIFICATION_DATA } from '../data/mockData';

interface OfficerNotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: OfficerNotification[];
  officerUser?: { name: string; phone: string; department?: string };
  qualification?: OfficerQualification;
  onInspectCluster: (clusterCode: string) => void;
}

export const OfficerNotificationDrawer: React.FC<OfficerNotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  officerUser = { name: 'S. Ramanathan', phone: '+91 94440 12345', department: 'Zonal Municipal Division (Ward 4-15)' },
  qualification = OFFICER_QUALIFICATION_DATA,
  onInspectCluster,
}) => {
  const [activeTab, setActiveTab] = useState<'alerts' | 'credentials'>('alerts');
  const [filterType, setFilterType] = useState<'all' | 'critical' | 'dispatch' | 'merge' | 'verification'>('all');

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((notif) => {
    if (filterType === 'critical') return notif.type === 'critical_emergency' || notif.severity >= 5 || notif.priorityScore >= 130;
    if (filterType === 'dispatch') return notif.type === 'crew_dispatched';
    if (filterType === 'merge') return notif.type === 'cluster_merged';
    if (filterType === 'verification') return notif.type === 'resolution_pending';
    return true;
  });

  const formatNotificationTime = (timeString?: string) => {
    if (!timeString) return 'Just now';
    const date = new Date(timeString);
    if (isNaN(date.getTime())) {
      const num = Number(timeString);
      if (!isNaN(num)) {
        const d = new Date(num);
        if (!isNaN(d.getTime())) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return 'Just now';
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatNotificationDate = (timeString?: string) => {
    if (!timeString) return 'Today';
    const date = new Date(timeString);
    if (isNaN(date.getTime())) return 'Today';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const criticalCount = notifications.filter((n) => n.type === 'critical_emergency' || n.priorityScore >= 130).length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Officer Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm">Municipal Command &amp; Officer Alerts</h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                  Officer
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {officerUser.name} • <span className="text-sky-300 font-medium">{officerUser.department}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs: Officer Operational Alerts vs Officer Qualifications */}
        <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('alerts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'alerts'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Operational Feed</span>
              {notifications.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-900/80 text-sky-200 font-mono text-[10px]">
                  {notifications.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('credentials')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'credentials'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Officer Qualifications</span>
            </button>
          </div>

          {criticalCount > 0 && activeTab === 'alerts' && (
            <span className="text-[10px] text-rose-400 font-bold flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-950/60 border border-rose-800/60">
              <Zap className="w-2.5 h-2.5 animate-pulse" />
              {criticalCount} Critical
            </span>
          )}
        </div>

        {/* Tab 1: Officer Operational Alerts & Tactical Feed */}
        {activeTab === 'alerts' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Filter Pills */}
            <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-900/60 flex items-center gap-1 overflow-x-auto scrollbar-none text-[11px]">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-slate-700 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilterType('critical')}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                  filterType === 'critical'
                    ? 'bg-rose-500/30 text-rose-300 font-bold border border-rose-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Flame className="w-3 h-3 text-rose-400" />
                <span>Critical Hazards</span>
              </button>
              <button
                onClick={() => setFilterType('dispatch')}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                  filterType === 'dispatch'
                    ? 'bg-sky-500/30 text-sky-300 font-bold border border-sky-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Truck className="w-3 h-3 text-sky-400" />
                <span>Crew Dispatches</span>
              </button>
              <button
                onClick={() => setFilterType('merge')}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                  filterType === 'merge'
                    ? 'bg-indigo-500/30 text-indigo-300 font-bold border border-indigo-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3 h-3 text-indigo-400" />
                <span>Spatial Merges</span>
              </button>
              <button
                onClick={() => setFilterType('verification')}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                  filterType === 'verification'
                    ? 'bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>AI Verifications</span>
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs space-y-2">
                  <ShieldCheck className="w-8 h-8 mx-auto text-slate-600 opacity-50" />
                  <p>No alerts in this category.</p>
                  <p className="text-[11px] text-slate-600">
                    Operational notifications update automatically on new citizen grievances and crew activities.
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notif) => {
                  const rawTime = notif.timestamp;
                  const timeDisplay = formatNotificationTime(rawTime);
                  const dateDisplay = formatNotificationDate(rawTime);

                  const isCritical = notif.type === 'critical_emergency' || notif.severity >= 5 || notif.priorityScore >= 130;
                  const isDispatch = notif.type === 'crew_dispatched';
                  const isVerification = notif.type === 'resolution_pending';
                  const isMerge = notif.type === 'cluster_merged';

                  return (
                    <div
                      key={notif.id}
                      className={`p-4 rounded-2xl border text-xs space-y-2.5 transition-all shadow-md ${
                        isCritical
                          ? 'bg-rose-950/40 border-rose-500/50 shadow-rose-950/20'
                          : isDispatch
                          ? 'bg-sky-950/30 border-sky-500/40'
                          : isVerification
                          ? 'bg-emerald-950/30 border-emerald-500/40'
                          : isMerge
                          ? 'bg-indigo-950/30 border-indigo-500/40'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      {/* Top Badges & Meta */}
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${
                            isCritical
                              ? 'bg-rose-600 text-white animate-pulse'
                              : isDispatch
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                              : isVerification
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          }`}>
                            {isCritical && <Flame className="w-3 h-3 fill-current" />}
                            {isDispatch && <Truck className="w-3 h-3" />}
                            {isVerification && <CheckCircle2 className="w-3 h-3" />}
                            {isMerge && <Layers className="w-3 h-3" />}
                            <span>{notif.type.replace(/_/g, ' ')}</span>
                          </span>

                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-200">
                            {notif.clusterCode}
                          </span>

                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950/60 text-amber-300 border border-amber-800/40 font-mono">
                            Priority: {notif.priorityScore}
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <span>{dateDisplay}</span>
                          <span>•</span>
                          <span className="text-slate-200 font-semibold">{timeDisplay}</span>
                        </div>
                      </div>

                      {/* Title */}
                      <h4 className="font-bold text-white text-xs leading-snug">
                        {notif.title}
                      </h4>

                      {/* Message details */}
                      <p className="text-slate-300 text-[11px] leading-relaxed bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                        {notif.message}
                      </p>

                      {/* Location & Action Footer */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          📍 {notif.locationName || notif.ward || 'Zonal Jurisdiction'}
                        </span>

                        <button
                          onClick={() => {
                            onInspectCluster(notif.clusterCode);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer active:scale-95 shadow-sm"
                        >
                          <span>Open in War Room</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Officer Qualifications & Zonal Clearance */}
        {activeTab === 'credentials' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            {/* Officer Profile Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-950 border border-indigo-500/30 space-y-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-lg">
                  {qualification.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{qualification.name}</h4>
                  <p className="text-indigo-300 text-xs font-semibold">{qualification.role}</p>
                  <p className="text-[11px] text-slate-400">{qualification.department}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Officer ID</span>
                  <span className="font-mono text-white font-semibold">{qualification.id}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Zonal Jurisdiction</span>
                  <span className="text-emerald-300 font-semibold">{qualification.zonalAuthority}</span>
                </div>
              </div>
            </div>

            {/* Clearance & Authority Level */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Clearance &amp; Dispatch Authority
              </span>
              <p className="text-white font-bold text-xs bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                {qualification.clearanceLevel}
              </p>
            </div>

            {/* Officer Certifications */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-indigo-400" />
                Verified Municipal Certifications
              </span>
              <div className="space-y-1.5">
                {qualification.certifications.map((cert, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2 text-slate-200 text-[11px]"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{cert}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Authorized Powers & Autonomous Dispatches */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Delegated Operational Powers
              </span>
              <div className="space-y-1.5">
                {qualification.authorizedActions.map((action, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2 text-slate-300 text-[11px]"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-center text-[11px] text-slate-500">
          NagarAI Municipal Operations Center &bull; Zonal Command Grid
        </div>
      </div>
    </div>
  );
};
