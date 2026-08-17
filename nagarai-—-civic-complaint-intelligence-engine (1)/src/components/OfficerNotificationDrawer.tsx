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
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white border-l border-slate-200 h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Officer Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">Municipal Command &amp; Officer Alerts</h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 uppercase">
                  Officer
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {officerUser.name} • <span className="text-indigo-700 font-semibold">{officerUser.department}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-200/70 hover:bg-slate-300 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs: Officer Operational Alerts vs Officer Qualifications */}
        <div className="px-4 py-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('alerts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'alerts'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Operational Feed</span>
              {notifications.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/20 text-white font-mono text-[10px]">
                  {notifications.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('credentials')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'credentials'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>Officer Qualifications</span>
            </button>
          </div>

          {criticalCount > 0 && activeTab === 'alerts' && (
            <span className="text-[10px] text-rose-700 font-bold flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 border border-rose-300">
              <Zap className="w-2.5 h-2.5 animate-pulse text-rose-600" />
              {criticalCount} Critical
            </span>
          )}
        </div>

        {/* Tab 1: Officer Operational Alerts & Tactical Feed */}
        {activeTab === 'alerts' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-slate-50/50">
            {/* Filter Pills */}
            <div className="px-4 py-2 border-b border-slate-200 bg-white flex items-center gap-1 overflow-x-auto scrollbar-none text-[11px]">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-slate-900 text-white font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilterType('critical')}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                  filterType === 'critical'
                    ? 'bg-rose-100 text-rose-800 font-bold border border-rose-300'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Flame className="w-3 h-3 text-rose-600" />
                <span>Critical Hazards</span>
              </button>
              <button
                onClick={() => setFilterType('dispatch')}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                  filterType === 'dispatch'
                    ? 'bg-sky-100 text-sky-800 font-bold border border-sky-300'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Truck className="w-3 h-3 text-sky-600" />
                <span>Crew Dispatches</span>
              </button>
              <button
                onClick={() => setFilterType('merge')}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                  filterType === 'merge'
                    ? 'bg-indigo-100 text-indigo-800 font-bold border border-indigo-300'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3 h-3 text-indigo-600" />
                <span>Spatial Merges</span>
              </button>
              <button
                onClick={() => setFilterType('verification')}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                  filterType === 'verification'
                    ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>AI Verifications</span>
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs space-y-2">
                  <ShieldCheck className="w-8 h-8 mx-auto text-slate-400 opacity-60" />
                  <p className="font-semibold text-slate-700">No alerts in this category.</p>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
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
                      className={`p-4 rounded-2xl border text-xs space-y-2.5 transition-all shadow-2xs ${
                        isCritical
                          ? 'bg-rose-50/70 border-rose-200 shadow-rose-100/50'
                          : isDispatch
                          ? 'bg-sky-50/70 border-sky-200'
                          : isVerification
                          ? 'bg-emerald-50/70 border-emerald-200'
                          : isMerge
                          ? 'bg-indigo-50/70 border-indigo-200'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      {/* Top Badges & Meta */}
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${
                            isCritical
                              ? 'bg-rose-600 text-white animate-pulse'
                              : isDispatch
                              ? 'bg-sky-100 text-sky-800 border border-sky-300'
                              : isVerification
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                          }`}>
                            {isCritical && <Flame className="w-3 h-3 fill-current" />}
                            {isDispatch && <Truck className="w-3 h-3" />}
                            {isVerification && <CheckCircle2 className="w-3 h-3" />}
                            {isMerge && <Layers className="w-3 h-3" />}
                            <span>{notif.type.replace(/_/g, ' ')}</span>
                          </span>

                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {notif.clusterCode}
                          </span>

                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 font-mono">
                            Priority: {notif.priorityScore}
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                          <span>{dateDisplay}</span>
                          <span>•</span>
                          <span className="text-slate-700 font-semibold">{timeDisplay}</span>
                        </div>
                      </div>

                      {/* Title */}
                      <h4 className="font-bold text-slate-900 text-xs leading-snug">
                        {notif.title}
                      </h4>

                      {/* Message details */}
                      <p className="text-slate-700 text-[11px] leading-relaxed bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs font-medium">
                        {notif.message}
                      </p>

                      {/* Location & Action Footer */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200">
                        <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                          📍 {notif.locationName || notif.ward || 'Zonal Jurisdiction'}
                        </span>

                        <button
                          onClick={() => {
                            onInspectCluster(notif.clusterCode);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer active:scale-95 shadow-2xs"
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
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs bg-slate-50/50">
            {/* Officer Profile Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-slate-50 border border-indigo-200 space-y-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-xs">
                  {qualification.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{qualification.name}</h4>
                  <p className="text-indigo-700 text-xs font-bold">{qualification.role}</p>
                  <p className="text-[11px] text-slate-500 font-medium">{qualification.department}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-[11px]">
                <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Officer ID</span>
                  <span className="font-mono text-slate-900 font-semibold">{qualification.id}</span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Zonal Jurisdiction</span>
                  <span className="text-emerald-700 font-bold">{qualification.zonalAuthority}</span>
                </div>
              </div>
            </div>

            {/* Clearance & Authority Level */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-2xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                Clearance &amp; Dispatch Authority
              </span>
              <p className="text-slate-800 font-bold text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                {qualification.clearanceLevel}
              </p>
            </div>

            {/* Officer Certifications */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-indigo-600" />
                Verified Municipal Certifications
              </span>
              <div className="space-y-1.5">
                {qualification.certifications.map((cert, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-start gap-2 text-slate-700 text-[11px] shadow-2xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{cert}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Authorized Powers & Autonomous Dispatches */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                Delegated Operational Powers
              </span>
              <div className="space-y-1.5">
                {qualification.authorizedActions.map((action, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-start gap-2 text-slate-700 text-[11px] shadow-2xs"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500 font-medium">
          NagarAI Municipal Operations Center &bull; Zonal Command Grid
        </div>
      </div>
    </div>
  );
};
