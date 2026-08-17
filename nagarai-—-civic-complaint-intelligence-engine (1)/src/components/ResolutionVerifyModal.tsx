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
  Users,
  Image as ImageIcon
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MasterCluster } from '../types';

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
    cluster.resolution?.afterPhotoUrl || null
  );
  const [afterPhotoBase64, setAfterPhotoBase64] = useState<string | null>(null);
  const [notes, setNotes] = useState(
    cluster.resolution?.resolutionNotes || ''
  );
  const [isVerifying, setIsVerifying] = useState(false);

  const beforePhoto = cluster.complaints.find((c) => c.photoUrl)?.photoUrl || null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                "Is It Fixed?" Closed-Loop AI Photo Verification
              </h2>
              <p className="text-xs text-slate-400">
                Master Incident {cluster.clusterCode} &bull; Broadcasts resolution to {cluster.affectedCitizenCount} merged citizens
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs text-slate-300">
          {/* Incident Summary */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-mono text-sky-400 font-bold">{cluster.clusterCode}</span>
              <h4 className="text-sm font-bold text-white mt-0.5">{cluster.title}</h4>
              <div className="text-slate-400 mt-1">📍 {cluster.locationName} &bull; 🏢 {cluster.department}</div>
            </div>

            <div className="text-right">
              <span className="px-3 py-1 rounded-full font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                👥 {cluster.affectedCitizenCount} Citizen Roster
              </span>
            </div>
          </div>

          {/* Side-by-side Before vs After Photo Proof */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Before Photo */}
            <div className="space-y-2">
              <div className="font-bold text-slate-400 flex items-center justify-between">
                <span>BEFORE (Reported Defect)</span>
                <span className="text-rose-400 font-mono">Severity: {cluster.baseSeverity}/5</span>
              </div>
              {beforePhoto ? (
                <img
                  src={beforePhoto}
                  alt="Before"
                  className="w-full h-48 rounded-2xl object-cover border border-slate-700 shadow-md"
                />
              ) : (
                <div className="w-full h-48 rounded-2xl border border-dashed border-slate-700 bg-slate-950 flex flex-col items-center justify-center text-slate-500 text-xs">
                  <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                  <span>No before photo uploaded</span>
                </div>
              )}
            </div>

            {/* After Photo */}
            <div className="space-y-2">
              <div className="font-bold text-emerald-400 flex items-center justify-between">
                <span>AFTER (Field Repair Evidence)</span>
                <label className="text-[11px] text-sky-400 hover:underline cursor-pointer flex items-center gap-1">
                  <Upload className="w-3 h-3" /> Upload Custom Photo
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
              {afterPhotoPreview ? (
                <img
                  src={afterPhotoPreview}
                  alt="After"
                  className="w-full h-48 rounded-2xl object-cover border border-emerald-500/50 shadow-md"
                />
              ) : (
                <label className="w-full h-48 rounded-2xl border border-dashed border-emerald-500/40 bg-emerald-950/10 flex flex-col items-center justify-center text-emerald-400 text-xs cursor-pointer hover:bg-emerald-950/20 transition-colors">
                  <Camera className="w-8 h-8 mb-2 opacity-70" />
                  <span className="font-semibold">Click to upload repair photo</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* Resolution Notes */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Official Resolution Summary &amp; Work Report</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Citizen Broadcast Notification Preview */}
          <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-800/40 space-y-2">
            <div className="font-bold text-indigo-300 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Automated Broadcast to all {cluster.affectedCitizenCount} Affected Citizens:
            </div>
            <p className="text-slate-300 italic text-[11px]">
              "Good news! Municipal {cluster.department} has completed repairs for {cluster.clusterCode} ({cluster.locationName}). AI Quality Verification score: 96%. Tap to inspect Before/After photos and confirm resolution."
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleExecuteResolution}
            disabled={isVerifying}
            className="px-6 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            {isVerifying ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
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
