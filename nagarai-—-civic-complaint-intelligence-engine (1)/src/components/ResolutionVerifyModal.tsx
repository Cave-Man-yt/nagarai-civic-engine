import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Camera, 
  CheckCircle2, 
  Upload, 
  ShieldCheck, 
  ArrowRight,
  Send,
  Users
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MasterCluster } from '../types';
import { SAMPLE_CIVIC_PHOTOS } from '../data/mockData';

interface ResolutionVerifyModalProps {
  cluster: MasterCluster;
  onClose: () => void;
  onResolve: (clusterId: string, afterPhotoBase64?: string, resolutionNotes?: string) => Promise<void>;
}

export const ResolutionVerifyModal: React.FC<ResolutionVerifyModalProps> = ({
  cluster,
  onClose,
  onResolve,
}) => {
  const [afterPhotoPreview, setAfterPhotoPreview] = useState<string | null>(
    cluster.resolution?.afterPhotoUrl || 
    (cluster.category === 'garbage_dump' ? SAMPLE_CIVIC_PHOTOS.resolved_garbage : SAMPLE_CIVIC_PHOTOS.resolved_road)
  );
  const [afterPhotoBase64, setAfterPhotoBase64] = useState<string | null>(null);
  const [notes, setNotes] = useState(
    cluster.resolution?.resolutionNotes || 
    'Road crater filled with hot-mix asphalt, compacted and leveled. Pedestrian pathway restored.'
  );
  const [isVerifying, setIsVerifying] = useState(false);

  const beforePhoto = cluster.complaints.find((c) => c.photoUrl)?.photoUrl || 
    (cluster.category === 'garbage_dump' ? SAMPLE_CIVIC_PHOTOS.garbage_dump : cluster.category === 'live_wire_hazard' ? SAMPLE_CIVIC_PHOTOS.live_wire : SAMPLE_CIVIC_PHOTOS.pothole_crater);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        setAfterPhotoPreview(res);
        setAfterPhotoBase64(res.split(',')[1]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExecuteResolution = async () => {
    setIsVerifying(true);
    try {
      await onResolve(cluster.id, afterPhotoBase64 || undefined, notes);
      
      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error(err);
      alert('Verification error');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50/50 to-indigo-50/50 p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                "Is It Fixed?" Closed-Loop AI Photo Verification
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Master Incident {cluster.clusterCode} &bull; Broadcasts resolution to {cluster.affectedCitizenCount} merged citizens
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-200/70 hover:bg-slate-300 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs text-slate-700 bg-slate-50/50">
          {/* Incident Summary */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
            <div>
              <span className="font-mono text-sky-700 font-bold">{cluster.clusterCode}</span>
              <h4 className="text-sm font-bold text-slate-900 mt-0.5">{cluster.title}</h4>
              <div className="text-slate-500 mt-1 font-medium">📍 {cluster.locationName} &bull; 🏢 {cluster.department}</div>
            </div>

            <div className="text-right">
              <span className="px-3 py-1 rounded-full font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                👥 {cluster.affectedCitizenCount} Citizen Roster
              </span>
            </div>
          </div>

          {/* Side-by-side Before vs After Photo Proof */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Before Photo */}
            <div className="space-y-2">
              <div className="font-bold text-slate-600 flex items-center justify-between">
                <span>BEFORE (Reported Defect)</span>
                <span className="text-rose-700 font-mono font-bold">Severity: {cluster.baseSeverity}/5</span>
              </div>
              <img
                src={beforePhoto}
                alt="Before"
                className="w-full h-48 rounded-2xl object-cover border border-slate-200 shadow-2xs"
              />
            </div>

            {/* After Photo */}
            <div className="space-y-2">
              <div className="font-bold text-emerald-700 flex items-center justify-between">
                <span>AFTER (Field Repair Evidence)</span>
                <label className="text-[11px] text-sky-700 hover:underline cursor-pointer flex items-center gap-1 font-medium">
                  <Upload className="w-3 h-3" /> Upload Custom Photo
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
              <img
                src={afterPhotoPreview || SAMPLE_CIVIC_PHOTOS.resolved_road}
                alt="After"
                className="w-full h-48 rounded-2xl object-cover border border-emerald-300 shadow-2xs"
              />
            </div>
          </div>

          {/* Resolution Notes */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1.5">Official Resolution Summary &amp; Work Report</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full p-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-2xs"
            />
          </div>

          {/* Citizen Broadcast Notification Preview */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-2">
            <div className="font-bold text-indigo-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-700" />
              Automated Broadcast to all {cluster.affectedCitizenCount} Affected Citizens:
            </div>
            <p className="text-slate-600 italic text-[11px] font-medium leading-relaxed">
              "Good news! Municipal {cluster.department} has completed repairs for {cluster.clusterCode} ({cluster.locationName}). AI Quality Verification score: 96%. Tap to inspect Before/After photos and confirm resolution."
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleExecuteResolution}
            disabled={isVerifying}
            className="px-6 py-2.5 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            {isVerifying ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Running AI Vision Diff...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Verify with AI &amp; Close Loop</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
