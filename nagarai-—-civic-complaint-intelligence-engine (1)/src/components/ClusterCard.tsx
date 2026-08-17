import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  MapPin, 
  ShieldAlert, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Truck, 
  Sparkles, 
  Calculator, 
  Camera, 
  Mic, 
  FileText, 
  AlertTriangle,
  History,
  PhoneCall,
  Flame,
  Volume2,
  Pause
} from 'lucide-react';
import { MasterCluster, FieldCrew, ComplaintCategory } from '../types';
import { findNearbyLandmarks } from '../utils/geoUtils';
import { speakWording, stopSpeaking } from '../utils/speechUtils';

interface ClusterCardProps {
  cluster: MasterCluster;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onInspectFormula: (cluster: MasterCluster) => void;
  onDispatchCrew: (cluster: MasterCluster, crewId: string) => void;
  onOpenVerifyModal: (cluster: MasterCluster) => void;
  availableCrews: FieldCrew[];
}

export const ClusterCard: React.FC<ClusterCardProps> = ({
  cluster,
  isSelected,
  onSelect,
  onInspectFormula,
  onDispatchCrew,
  onOpenVerifyModal,
  availableCrews,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [selectedCrewId, setSelectedCrewId] = useState('');
  const [playingComplaintId, setPlayingComplaintId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const handlePlayVoice = (id: string, text: string, lang: string) => {
    if (playingComplaintId === id) {
      stopSpeaking();
      setPlayingComplaintId(null);
      return;
    }

    stopSpeaking();
    setPlayingComplaintId(id);

    const spoken = speakWording({
      text,
      language: lang || 'Tamil',
      rate: 0.95,
      onStart: () => setPlayingComplaintId(id),
      onEnd: () => setPlayingComplaintId(null),
      onError: () => setPlayingComplaintId(null),
    });

    if (!spoken) {
      setPlayingComplaintId(null);
    }
  };

  const isCritical = cluster.priorityScore >= 130 && cluster.status !== 'resolved';
  const isResolved = cluster.status === 'resolved';

  // Geo Bonus Analysis calculation
  const geoAnalysis = useMemo(() => {
    const lat = cluster.coordinates?.lat || 13.0827;
    const lng = cluster.coordinates?.lng || 80.2707;
    const allLandmarks = findNearbyLandmarks(lat, lng);

    // Merge any explicit landmarks from complaints
    cluster.complaints.forEach((c) => {
      (c.nearbyLandmarks || []).forEach((lm) => {
        if (!allLandmarks.some((item) => item.name === lm.name)) {
          allLandmarks.push(lm);
        }
      });
    });

    // Check School (nearby threshold <= 400m)
    const school = allLandmarks.find((l) => l.type === 'school' && l.distanceMeters <= 400);
    // Check Hospital (nearby threshold <= 500m)
    const hospital = allLandmarks.find((l) => l.type === 'hospital' && l.distanceMeters <= 500);
    // Check Metro / Transit (nearby threshold <= 400m)
    const transit = allLandmarks.find(
      (l) => (l.type === 'metro' || (l.type as string) === 'transit') && l.distanceMeters <= 400
    );

    // Bonus points gained from each
    const schoolBonus = school ? (school.distanceMeters <= 120 ? 10 : school.distanceMeters <= 250 ? 8 : 5) : 0;
    const hospitalBonus = hospital ? (hospital.distanceMeters <= 120 ? 10 : hospital.distanceMeters <= 250 ? 8 : 5) : 0;
    const transitBonus = transit ? (transit.distanceMeters <= 150 ? 8 : transit.distanceMeters <= 250 ? 6 : 4) : 0;

    const totalBonus = schoolBonus + hospitalBonus + transitBonus;

    return {
      school: {
        hasNearby: !!school,
        distance: school?.distanceMeters,
        name: school?.name,
        bonus: schoolBonus,
      },
      hospital: {
        hasNearby: !!hospital,
        distance: hospital?.distanceMeters,
        name: hospital?.name,
        bonus: hospitalBonus,
      },
      transit: {
        hasNearby: !!transit,
        distance: transit?.distanceMeters,
        name: transit?.name,
        bonus: transitBonus,
      },
      totalBonus,
    };
  }, [cluster.coordinates, cluster.complaints]);

  // Category Icon
  const getCategoryIcon = (category: ComplaintCategory) => {
    switch (category) {
      case 'live_wire_hazard':
        return <Flame className="w-4 h-4 text-rose-400" />;
      case 'open_manhole':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'pothole':
        return <span className="text-sm">🕳️</span>;
      case 'garbage_dump':
        return <span className="text-sm">🗑️</span>;
      case 'waterlogging':
        return <span className="text-sm">🌊</span>;
      default:
        return <ShieldAlert className="w-4 h-4 text-sky-400" />;
    }
  };

  const priorityColor = isResolved
    ? 'from-emerald-500 to-teal-600 border-emerald-500/30'
    : isCritical
    ? 'from-rose-600 to-red-700 border-rose-500/50 animate-pulse'
    : cluster.priorityScore >= 90
    ? 'from-orange-500 to-amber-600 border-orange-500/40'
    : 'from-sky-600 to-blue-700 border-sky-500/30';

  const statusBadge = () => {
    switch (cluster.status) {
      case 'resolved':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Resolved &amp; Verified</span>;
      case 'dispatched':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-300 flex items-center gap-1"><Truck className="w-3 h-3" /> Crew En Route</span>;
      case 'in_progress':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">In Progress</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">Pending Dispatch</span>;
    }
  };

  return (
    <div
      onClick={() => onSelect(cluster.id)}
      className={`relative rounded-2xl transition-all duration-200 border bg-white shadow-sm overflow-hidden ${
        isSelected
          ? 'border-sky-500 ring-2 ring-sky-500/20 shadow-md'
          : isCritical
          ? 'border-rose-400 hover:border-rose-500'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Top Header Row */}
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-extrabold text-sky-800 bg-sky-100 px-2 py-0.5 rounded border border-sky-200">
              {cluster.clusterCode}
            </span>
            <span className="flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              {getCategoryIcon(cluster.category)}
              {(cluster.category || 'issue').replace(/_/g, ' ').toUpperCase()}
            </span>
            {statusBadge()}
          </div>

          {/* Priority Score Pill */}
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onInspectFormula(cluster);
              }}
              title="Inspect Explainable Math Formula"
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs border border-slate-200 transition-colors font-medium cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline font-mono">Formula</span>
            </button>

            <div className={`px-3.5 py-1 rounded-xl text-white font-extrabold text-sm flex items-center gap-1.5 shadow-sm bg-gradient-to-r ${priorityColor}`}>
              <span>Priority:</span>
              <span className="font-mono text-base">{cluster.priorityScore}</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug mb-2 hover:text-sky-700 transition-colors">
          {cluster.title}
        </h3>

        {/* Input Types & Language Badges Strip */}
        <div className="flex flex-wrap items-center gap-2 mb-3 pt-1 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Input Type:</span>
            <div className="flex items-center gap-1">
              {Array.from(new Set(cluster.complaints.map((c) => c.originalInputType || 'text'))).map((type: string, idx) => (
                <span
                  key={idx}
                  className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200 flex items-center gap-1"
                >
                  {type === 'voice' ? <Mic className="w-2.5 h-2.5 text-emerald-600" /> : type === 'photo' ? <Camera className="w-2.5 h-2.5 text-sky-600" /> : <FileText className="w-2.5 h-2.5 text-indigo-600" />}
                  {type.toUpperCase()}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Language:</span>
            <div className="flex items-center gap-1">
              {Array.from(new Set(cluster.complaints.map((c) => c.language || 'Tamil'))).map((lang: string, idx) => (
                <span
                  key={idx}
                  className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200"
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Location & Sensitive Landmark Tags */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mb-3">
          <span className="flex items-center gap-1 text-slate-600 font-medium">
            <MapPin className="w-3.5 h-3.5 text-rose-500" />
            {cluster.locationName}
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-600 font-medium">{cluster.ward}</span>
          <span className="text-slate-300">•</span>
          <span className="text-indigo-800 font-semibold">🏢 {cluster.department}</span>
        </div>

        {/* Geo Bonus Analysis Section */}
        <div className="mb-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
          <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
            <span className="font-bold text-sky-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <span>📍</span> Geo Bonus Analysis
            </span>
            <span className="font-mono text-emerald-700 font-extrabold text-xs">
              Total Geo Bonus: {geoAnalysis.totalBonus > 0 ? `+${geoAnalysis.totalBonus}` : '0'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
            {/* School */}
            <div className="p-2 rounded-lg bg-white border border-slate-200 flex flex-col justify-between gap-1 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Nearby school:</span>
                <span className={`font-bold ${geoAnalysis.school.hasNearby ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {geoAnalysis.school.hasNearby ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100">
                <span className="text-slate-600">
                  {geoAnalysis.school.hasNearby ? `School within ${geoAnalysis.school.distance}m:` : 'School within 100m:'}
                </span>
                <span className={`font-mono font-bold ${geoAnalysis.school.bonus > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {geoAnalysis.school.bonus > 0 ? `+${geoAnalysis.school.bonus}` : '0'}
                </span>
              </div>
            </div>

            {/* Hospital */}
            <div className="p-2 rounded-lg bg-white border border-slate-200 flex flex-col justify-between gap-1 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Nearby hospital:</span>
                <span className={`font-bold ${geoAnalysis.hospital.hasNearby ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {geoAnalysis.hospital.hasNearby ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100">
                <span className="text-slate-600">
                  {geoAnalysis.hospital.hasNearby ? `Hospital within ${geoAnalysis.hospital.distance}m:` : 'Hospital within 100m:'}
                </span>
                <span className={`font-mono font-bold ${geoAnalysis.hospital.bonus > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {geoAnalysis.hospital.bonus > 0 ? `+${geoAnalysis.hospital.bonus}` : '0'}
                </span>
              </div>
            </div>

            {/* Metro/Transit */}
            <div className="p-2 rounded-lg bg-white border border-slate-200 flex flex-col justify-between gap-1 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Nearby metro/transit:</span>
                <span className={`font-bold ${geoAnalysis.transit.hasNearby ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {geoAnalysis.transit.hasNearby ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100">
                <span className="text-slate-600">
                  {geoAnalysis.transit.hasNearby ? `Metro within ${geoAnalysis.transit.distance}m:` : 'Metro within 150m:'}
                </span>
                <span className={`font-mono font-bold ${geoAnalysis.transit.bonus > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {geoAnalysis.transit.bonus > 0 ? `+${geoAnalysis.transit.bonus}` : '0'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Proximity Boost Highlight */}
        {cluster.priorityBreakdown.proximityBoost > 0 && (
          <div className="mb-3 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 flex items-center gap-2">
            <span className="text-base">📍</span>
            <span>
              <b>Sensitive Proximity Zone (+{cluster.priorityBreakdown.proximityBoost} pts):</b> {cluster.priorityBreakdown.explanation}
            </span>
          </div>
        )}

        {/* Key Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-600" />
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Affected Citizens</div>
              <div className="font-bold text-slate-900 text-sm">{cluster.affectedCitizenCount} Reports Merged</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">SLA Target</div>
              <div className="font-bold text-amber-800">{cluster.slaHours}h Max</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Severity Level</div>
              <div className="font-bold text-slate-900">{cluster.baseSeverity} / 5</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-emerald-600" />
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Assigned Unit</div>
              <div className="font-bold text-slate-800 truncate">
                {cluster.assignedCrew ? cluster.assignedCrew.name.split(' ')[0] : 'Unassigned'}
              </div>
            </div>
          </div>
        </div>

        {/* Resolution Info if Resolved */}
        {isResolved && cluster.resolution && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
            <div className="flex items-center justify-between text-emerald-900 font-bold mb-1">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                AI Quality Verification: {cluster.resolution.aiVerificationScore}% Confidence
              </span>
              <span className="text-[11px] text-slate-500">
                {new Date(cluster.resolution.resolvedAt).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-slate-700 mb-2">{cluster.resolution.aiVerificationSummary}</p>
            <div className="flex items-center gap-3 text-[11px] text-emerald-800 font-medium">
              <span>👥 Citizen Votes: {cluster.resolution.citizenConfirmations.confirmed} Confirmed Fixed</span>
              {cluster.resolution.citizenConfirmations.disputed > 0 && (
                <span className="text-rose-700 font-bold">⚠️ {cluster.resolution.citizenConfirmations.disputed} Disputed</span>
              )}
            </div>
          </div>
        )}

        {/* Bottom Actions Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="flex items-center gap-1 text-xs font-bold text-sky-700 hover:text-sky-800 py-1 px-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              {isExpanded ? 'Hide Complaints' : `View ${cluster.complaints.length} Merged Complaint${cluster.complaints.length > 1 ? 's' : ''}`}
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowLogs(!showLogs);
              }}
              className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 py-1 px-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <History className="w-3.5 h-3.5" />
              Audit Log ({cluster.activityLogs.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {!isResolved ? (
              <>
                {/* Dispatch Crew Dropdown */}
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <select
                    value={selectedCrewId || cluster.assignedCrew?.crewId || ''}
                    onChange={(e) => {
                      const cId = e.target.value;
                      setSelectedCrewId(cId);
                      if (cId) onDispatchCrew(cluster, cId);
                    }}
                    className="text-xs bg-slate-50 text-slate-800 border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none font-medium"
                  >
                    <option value="">-- Assign Crew --</option>
                    {availableCrews.map((cr) => (
                      <option key={cr.crewId} value={cr.crewId}>
                        {cr.name} ({cr.department.split(' ')[0]})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Verify & Resolve Modal Trigger */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenVerifyModal(cluster);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                  Verify &amp; Resolve
                </button>
              </>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenVerifyModal(cluster);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-emerald-800 border border-emerald-300 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                View Verification Photos
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Section: Merged Complaints Roster */}
      {isExpanded && (
        <div className="bg-slate-50 border-t border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
            <span>DEDUPLICATED CITIZEN REPORTS ROSTER ({cluster.complaints.length})</span>
            <span className="text-emerald-700">Spatial Distance &le; 250m &bull; Semantic Matched</span>
          </div>

          <div className="space-y-2.5">
            {cluster.complaints.map((c, idx) => (
              <div
                key={c.id || idx}
                className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2 font-semibold text-slate-900">
                    <span className="font-mono text-sky-700 font-bold text-[11px]">{c.ticketNumber}</span>
                    <span>{c.citizenName}</span>
                    <span className="text-slate-500 text-[11px] flex items-center gap-1 font-normal">
                      <PhoneCall className="w-2.5 h-2.5" /> {c.citizenPhone}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-50 text-indigo-800 border border-indigo-200 font-medium">
                      {c.language}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-sky-100 text-sky-800 border border-sky-200 flex items-center gap-1 font-medium">
                      {c.originalInputType === 'voice' ? <Mic className="w-2.5 h-2.5" /> : c.originalInputType === 'photo' ? <Camera className="w-2.5 h-2.5" /> : <FileText className="w-2.5 h-2.5" />}
                      {(c.originalInputType || 'text').toUpperCase()}
                    </span>
                  </div>

                  <p className="text-slate-700 italic text-[11px] font-medium">
                    "{c.rawInputText || c.cleanDescription}"
                  </p>

                  {c.transcription && c.transcription !== c.rawInputText && (
                    <p className="text-emerald-800 text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1 font-medium">
                      <Mic className="w-2.5 h-2.5 text-emerald-600" />
                      <span>Transcribed Voice: "{c.transcription}"</span>
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="text-[10px] text-slate-500 font-medium">
                      📍 {c.locationName} ({c.coordinates.lat.toFixed(4)}, {c.coordinates.lng.toFixed(4)})
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayVoice(c.id || `${idx}`, c.transcription || c.rawInputText || c.cleanDescription, c.language);
                      }}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        playingComplaintId === (c.id || `${idx}`)
                          ? 'bg-amber-500 text-slate-950 ring-1 ring-amber-400'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                      title="Listen to this complaint's spoken wordings"
                    >
                      {playingComplaintId === (c.id || `${idx}`) ? (
                        <>
                          <Pause className="w-3 h-3 text-slate-950" />
                          <span>Stop Voice</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3 text-emerald-600" />
                          <span>Listen / Tell Wordings</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {c.photoUrl && (
                  <img
                    src={c.photoUrl}
                    alt="Evidence"
                    className="w-16 h-16 rounded-lg object-cover border border-slate-200 shadow-2xs"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expandable Section: Audit Activity Logs */}
      {showLogs && (
        <div className="bg-slate-50 border-t border-slate-200 p-4 text-xs">
          <div className="font-bold text-slate-600 mb-2">INCIDENT LIFECYCLE &amp; AUDIT TRAIL</div>
          <div className="space-y-2">
            {cluster.activityLogs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2 text-[11px]">
                <span className="text-slate-500 font-mono whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className="font-bold text-sky-700">[{log.action}]</span>
                <span className="text-slate-700 font-medium">{log.details || log.actor}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
