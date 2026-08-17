import React, { useState } from 'react';
import { 
  X, 
  Bell, 
  MessageSquare, 
  PhoneCall, 
  CheckCircle2, 
  AlertTriangle, 
  Truck, 
  ThumbsUp, 
  ThumbsDown,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { CitizenNotification } from '../types';

interface CitizenNotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: CitizenNotification[];
  onVote: (notificationId: string, vote: 'confirmed' | 'disputed') => Promise<void>;
  onInspectCluster: (clusterCode: string) => void;
  citizenUser?: { name: string; phone: string };
}

export const CitizenNotificationDrawer: React.FC<CitizenNotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onVote,
  onInspectCluster,
  citizenUser = { name: 'Anand Kumar', phone: '+91 98401 55678' },
}) => {
  const [channelFilter, setChannelFilter] = useState<'all' | 'sms' | 'whatsapp'>('all');

  if (!isOpen) return null;

  // Filter notifications for this citizen
  const citizenNotifications = notifications.filter((notif) => {
    // If notif has recipientPhone or citizenPhone, match or include general citizen updates
    if (channelFilter !== 'all' && notif.channel !== channelFilter) return false;
    return true;
  });

  const formatNotificationTime = (timeString?: string) => {
    if (!timeString) return 'Just now';
    const date = new Date(timeString);
    if (isNaN(date.getTime())) {
      // Try parsing numeric timestamp or fallback
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

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm">Citizen SMS &amp; WhatsApp Feed</h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                  Citizen
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                <span>Alerts sent to:</span>
                <span className="text-slate-200 font-mono font-semibold">{citizenUser.phone}</span>
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

        {/* Channel Filter Tabs */}
        <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setChannelFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                channelFilter === 'all'
                  ? 'bg-slate-700 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Alerts ({notifications.length})
            </button>
            <button
              onClick={() => setChannelFilter('sms')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                channelFilter === 'sms'
                  ? 'bg-sky-500/30 text-sky-300 font-bold border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              SMS
            </button>
            <button
              onClick={() => setChannelFilter('whatsapp')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                channelFilter === 'whatsapp'
                  ? 'bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              WhatsApp
            </button>
          </div>
          <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            Live Broadcast
          </span>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {citizenNotifications.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto text-slate-600 opacity-50" />
              <p>No citizen SMS alerts found.</p>
              <p className="text-[11px] text-slate-600">
                File a new grievance in the Citizen Portal to receive instant automated SMS updates!
              </p>
            </div>
          ) : (
            citizenNotifications.map((notif) => {
              const isWhatsApp = notif.channel === 'whatsapp';
              const rawTime = notif.sentAt || notif.timestamp;
              const timeDisplay = formatNotificationTime(rawTime);
              const dateDisplay = formatNotificationDate(rawTime);

              return (
                <div
                  key={notif.id}
                  className={`p-4 rounded-2xl border text-xs space-y-2.5 transition-all shadow-md ${
                    notif.type === 'resolved'
                      ? 'bg-emerald-950/30 border-emerald-500/40'
                      : notif.type === 'dispatched'
                      ? 'bg-sky-950/30 border-sky-500/40'
                      : notif.type === 'merged'
                      ? 'bg-indigo-950/30 border-indigo-500/40'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white flex items-center gap-1 text-[11px]">
                        <PhoneCall className="w-3 h-3 text-emerald-400" />
                        {notif.recipientPhone || notif.citizenPhone || citizenUser.phone}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        isWhatsApp
                          ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
                          : 'bg-sky-900/60 text-sky-300 border border-sky-700/50'
                      }`}>
                        {isWhatsApp ? 'WhatsApp' : 'SMS'}
                      </span>
                      {notif.ticketNumber && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-300 font-mono">
                          {notif.ticketNumber}
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <span>{dateDisplay}</span>
                      <span>•</span>
                      <span className="text-slate-300 font-semibold">{timeDisplay}</span>
                    </div>
                  </div>

                  <p className="text-slate-100 text-[11px] leading-relaxed bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                    "{notif.message}"
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => onInspectCluster(notif.clusterCode)}
                      className="text-[11px] font-mono text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Master Ticket: {notif.clusterCode}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </button>

                    {/* Interactive Citizen Confirmation on Resolution */}
                    {notif.type === 'resolved' && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onVote(notif.id, 'confirmed')}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer shadow-sm active:scale-95"
                        >
                          <ThumbsUp className="w-3 h-3" /> Confirm Fix
                        </button>
                        <button
                          onClick={() => onVote(notif.id, 'disputed')}
                          className="px-2 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <ThumbsDown className="w-3 h-3" /> Dispute
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-center text-[11px] text-slate-500">
          Powered by NagarAI Automated Citizen Grievance Webhook Engine
        </div>
      </div>
    </div>
  );
};
