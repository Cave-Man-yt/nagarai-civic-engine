import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  Map as MapIcon, 
  ListFilter, 
  Search, 
  Filter, 
  TrendingDown, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Users, 
  Building2, 
  Sparkles,
  ArrowUpDown,
  Zap,
  RotateCcw,
  Mic,
  Camera,
  FileText,
  MapPin,
  ChevronRight,
  Flame,
  AlertTriangle,
  Radio,
  SlidersHorizontal
} from 'lucide-react';
import { MasterCluster, FieldCrew, ComplaintCategory, Department, StructuredComplaint } from '../types';
import { CivicMapView } from './CivicMapView';
import { ClusterCard } from './ClusterCard';

interface OfficialDashboardProps {
  clusters: MasterCluster[];
  crews: FieldCrew[];
  selectedClusterId: string | null;
  onSelectCluster: (id: string) => void;
  onInspectFormula: (cluster: MasterCluster) => void;
  onDispatchCrew: (cluster: MasterCluster, crewId: string) => void;
  onOpenVerifyModal: (cluster: MasterCluster) => void;
}

export const OfficialDashboard: React.FC<OfficialDashboardProps> = ({
  clusters,
  crews,
  selectedClusterId,
  onSelectCluster,
  onInspectFormula,
  onDispatchCrew,
  onOpenVerifyModal,
}) => {
  const [layoutMode, setLayoutMode] = useState<'queue_map' | 'split' | 'map' | 'cards'>('queue_map');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'citizens' | 'sla' | 'severity'>('priority');

  // Filter Chips for Complaint Queue
  const [activeFilterChip, setActiveFilterChip] = useState<'all' | 'pothole' | 'garbage_dump' | 'waterlogging' | 'broken_streetlight' | 'live_wire_hazard' | 'open_manhole'>('all');

  // KPI Calculations (Preserved exact formula & layout)
  const totalComplaintsMerged = clusters.reduce((acc, c) => acc + c.complaints.length, 0);
  const totalMasterClusters = clusters.length;
  const backlogReduction = totalComplaintsMerged > 0
    ? Math.round(((totalComplaintsMerged - totalMasterClusters) / totalComplaintsMerged) * 100)
    : 0;
  const criticalCount = clusters.filter((c) => c.priorityScore >= 130 && c.status !== 'resolved').length;
  const resolvedCount = clusters.filter((c) => c.status === 'resolved').length;
  const totalCitizens = clusters.reduce((acc, c) => acc + c.affectedCitizenCount, 0);

  // Flatten all individual complaints for the filterable Complaint Queue
  const allComplaintQueueItems = useMemo(() => {
    const list: Array<{
      id: string;
      ticketNumber: string;
      category: ComplaintCategory;
      cleanDescription: string;
      rawInputText?: string;
      inputType: 'voice' | 'photo' | 'text' | 'multimodal';
      language: string;
      priorityScore: number;
      affectedCitizens: number;
      status: 'pending' | 'dispatched' | 'resolved';
      locationName: string;
      timestamp: string;
      clusterId: string;
      clusterCode: string;
      parentCluster: MasterCluster;
    }> = [];

    clusters.forEach((cluster) => {
      cluster.complaints.forEach((cmp, idx) => {
        const idFormatted = cmp.id.startsWith('CMP-') ? cmp.id : `CMP-${cmp.id.replace(/\D/g, '') || (100 + idx)}`;
        list.push({
          id: idFormatted,
          ticketNumber: cmp.ticketNumber || `TKT-${cmp.id}`,
          category: cmp.category,
          cleanDescription: cmp.cleanDescription,
          rawInputText: cmp.rawInputText,
          inputType: cmp.originalInputType || 'text',
          language: cmp.language || 'Tamil',
          priorityScore: cluster.priorityScore,
          affectedCitizens: cluster.affectedCitizenCount,
          status: cluster.status === 'resolved' ? 'resolved' : cluster.status === 'dispatched' ? 'dispatched' : 'pending',
          locationName: cmp.locationName || cluster.locationName,
          timestamp: cmp.timestamp,
          clusterId: cluster.id,
          clusterCode: cluster.clusterCode,
          parentCluster: cluster,
        });
      });
    });

    return list;
  }, [clusters]);

  // Filtered Complaint Queue based on filter chips and search
  const filteredComplaintQueue = useMemo(() => {
    return allComplaintQueueItems.filter((item) => {
      // Filter Chip
      if (activeFilterChip !== 'all' && item.category !== activeFilterChip) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = (item.id || '').toLowerCase().includes(q);
        const matchTicket = (item.ticketNumber || '').toLowerCase().includes(q);
        const matchCategory = (item.category || '').toLowerCase().includes(q);
        const matchLoc = (item.locationName || '').toLowerCase().includes(q);
        const matchText = (item.rawInputText || item.cleanDescription || '').toLowerCase().includes(q);
        if (!matchId && !matchTicket && !matchCategory && !matchLoc && !matchText) {
          return false;
        }
      }

      return true;
    });
  }, [allComplaintQueueItems, activeFilterChip, searchQuery]);

  // Filtered & Sorted Master Clusters
  const filteredClusters = useMemo(() => {
    return clusters
      .filter((c) => {
        // Filter Chip
        if (activeFilterChip !== 'all' && c.category !== activeFilterChip) {
          return false;
        }

        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = (c.title || '').toLowerCase().includes(q);
          const matchCode = (c.clusterCode || '').toLowerCase().includes(q);
          const matchLoc = (c.locationName || '').toLowerCase().includes(q);
          const matchCitizen = (c.complaints || []).some((cmp) => (cmp.citizenName || '').toLowerCase().includes(q) || (cmp.ticketNumber || '').toLowerCase().includes(q));
          if (!matchTitle && !matchCode && !matchLoc && !matchCitizen) return false;
        }

        // Department
        if (selectedDepartment !== 'all' && c.department !== selectedDepartment) {
          return false;
        }

        // Category
        if (selectedCategory !== 'all' && c.category !== selectedCategory) {
          return false;
        }

        // Status
        if (selectedStatus !== 'all' && c.status !== selectedStatus) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'priority') return b.priorityScore - a.priorityScore;
        if (sortBy === 'citizens') return b.affectedCitizenCount - a.affectedCitizenCount;
        if (sortBy === 'sla') return a.slaHours - b.slaHours;
        if (sortBy === 'severity') return b.baseSeverity - a.baseSeverity;
        return 0;
      });
  }, [clusters, searchQuery, selectedDepartment, selectedCategory, selectedStatus, sortBy, activeFilterChip]);

  // Selected Cluster for Detail Inspector
  const selectedCluster = useMemo(() => {
    return clusters.find((c) => c.id === selectedClusterId) || filteredClusters[0] || clusters[0];
  }, [clusters, selectedClusterId, filteredClusters]);

  const getStatusColor = (status: 'pending' | 'dispatched' | 'resolved') => {
    switch (status) {
      case 'resolved':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'dispatched':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      case 'pending':
      default:
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    }
  };

  const getStatusLabel = (status: 'pending' | 'dispatched' | 'resolved') => {
    switch (status) {
      case 'resolved':
        return 'Resolved';
      case 'dispatched':
        return 'In Progress';
      case 'pending':
      default:
        return 'Pending';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ========================================================= */}
      {/* TOP STRATEGIC KPI METRICS STRIP (PRESERVED EXACTLY AS-IS) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* KPI 1: Merged Backlog Reduction */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/60 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-bold uppercase tracking-wider">Backlog Drop</span>
            <TrendingDown className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">{backlogReduction}%</div>
          <p className="text-[11px] text-emerald-400 mt-1">{totalComplaintsMerged} raw &rarr; {totalMasterClusters} master</p>
        </div>

        {/* KPI 2: Critical Life Hazards */}
        <div className={`p-4 rounded-2xl border shadow-md ${
          criticalCount > 0
            ? 'bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900 border-rose-500/50'
            : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-bold uppercase tracking-wider">Life Hazards</span>
            <Zap className="w-4 h-4 text-rose-400 animate-pulse" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-300 font-mono">{criticalCount}</div>
          <p className="text-[11px] text-rose-400/90 mt-1">Immediate &lt;4h SLA routing</p>
        </div>

        {/* KPI 3: Citizens Protected */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-bold uppercase tracking-wider">Citizens In Queue</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-sky-300 font-mono">{totalCitizens}</div>
          <p className="text-[11px] text-slate-400 mt-1">Across 15 municipal wards</p>
        </div>

        {/* KPI 4: Active Master Clusters */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-bold uppercase tracking-wider">Master Queues</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono">{totalMasterClusters}</div>
          <p className="text-[11px] text-slate-400 mt-1">Deduplicated work orders</p>
        </div>

        {/* KPI 5: Resolved & Photo-Verified */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-bold uppercase tracking-wider">AI Verified Fixed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">{resolvedCount}</div>
          <p className="text-[11px] text-emerald-400/90 mt-1">Closed-loop verified</p>
        </div>
      </div>

      {/* ========================================================= */}
      {/* FILTER CHIPS (ALL / POTHOLE / GARBAGE / WATERLOGGING / ETC) */}
      {/* ========================================================= */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Complaint ID (CMP-104), keyword, citizen, ward, or street..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* View Switcher Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-end lg:self-auto">
            <button
              onClick={() => setLayoutMode('queue_map')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                layoutMode === 'queue_map' ? 'bg-slate-800 text-sky-400 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Complaint Queue &amp; Map</span>
            </button>
            <button
              onClick={() => setLayoutMode('split')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                layoutMode === 'split' ? 'bg-slate-800 text-sky-400 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Master Clusters</span>
            </button>
            <button
              onClick={() => setLayoutMode('map')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                layoutMode === 'map' ? 'bg-slate-800 text-sky-400 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Map Only</span>
            </button>
            <button
              onClick={() => setLayoutMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                layoutMode === 'cards' ? 'bg-slate-800 text-sky-400 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Cards Grid</span>
            </button>
          </div>
        </div>

        {/* Filter Chips Bar (All / Pothole / Garbage / Waterlogging / Streetlight / Live Wire / Open Manhole) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-800/80 text-xs scrollbar-none">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-sky-400" /> Filter:
          </span>

          <button
            onClick={() => setActiveFilterChip('all')}
            className={`px-3 py-1 rounded-lg font-bold transition-colors whitespace-nowrap cursor-pointer ${
              activeFilterChip === 'all'
                ? 'bg-sky-500 text-slate-950 font-extrabold'
                : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            All Issues ({allComplaintQueueItems.length})
          </button>

          <button
            onClick={() => setActiveFilterChip('pothole')}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              activeFilterChip === 'pothole'
                ? 'bg-sky-500 text-slate-950 font-extrabold'
                : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            🕳️ Pothole
          </button>

          <button
            onClick={() => setActiveFilterChip('garbage_dump')}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              activeFilterChip === 'garbage_dump'
                ? 'bg-sky-500 text-slate-950 font-extrabold'
                : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            🗑️ Garbage
          </button>

          <button
            onClick={() => setActiveFilterChip('waterlogging')}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              activeFilterChip === 'waterlogging'
                ? 'bg-sky-500 text-slate-950 font-extrabold'
                : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            🌊 Waterlogging
          </button>

          <button
            onClick={() => setActiveFilterChip('broken_streetlight')}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              activeFilterChip === 'broken_streetlight'
                ? 'bg-sky-500 text-slate-950 font-extrabold'
                : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            💡 Streetlight
          </button>

          <button
            onClick={() => setActiveFilterChip('live_wire_hazard')}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              activeFilterChip === 'live_wire_hazard'
                ? 'bg-rose-500 text-slate-950 font-extrabold'
                : 'bg-slate-950 text-rose-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            ⚡ Live Wire
          </button>

          <button
            onClick={() => setActiveFilterChip('open_manhole')}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              activeFilterChip === 'open_manhole'
                ? 'bg-amber-500 text-slate-950 font-extrabold'
                : 'bg-slate-950 text-amber-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            ⚠️ Open Manhole
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 ml-auto text-slate-400 pl-2">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold"
            >
              <option value="priority">Priority Score &darr;</option>
              <option value="citizens">Affected Citizens &darr;</option>
              <option value="sla">Urgent SLA &uarr;</option>
              <option value="severity">Severity Level &darr;</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MAIN VIEW AREA: COMPLAINT QUEUE (LEFT) + MAP & DRAWER (RIGHT) */}
      {/* ========================================================= */}
      {layoutMode === 'queue_map' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ENHANCEMENT 2: COMPLAINT QUEUE SECTION (LEFT SIDE) */}
          <div className="lg:col-span-6 space-y-3 max-h-[780px] overflow-y-auto pr-1">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold px-1 sticky top-0 bg-slate-950/90 py-1.5 backdrop-blur-md z-10">
              <span className="text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <ListFilter className="w-4 h-4 text-sky-400" />
                Raw Ingestion Complaint Queue ({filteredComplaintQueue.length})
              </span>
              <span className="text-emerald-400 text-[11px]">Click row to open Detail Inspector</span>
            </div>

            {filteredComplaintQueue.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
                No complaints match the selected filter chip.
              </div>
            ) : (
              filteredComplaintQueue.map((item, idx) => {
                const isSelected = item.clusterId === selectedClusterId;
                return (
                  <div
                    key={item.id + idx}
                    onClick={() => onSelectCluster(item.clusterId)}
                    className={`p-4 rounded-2xl transition-all cursor-pointer border text-xs space-y-2.5 shadow-md ${
                      isSelected
                        ? 'bg-slate-900 border-sky-400 ring-2 ring-sky-400/30'
                        : 'bg-slate-900/90 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Row 1: ID / Category / Status / Priority */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* ID */}
                        <span className="font-mono text-xs font-extrabold text-sky-400 bg-sky-950 px-2.5 py-0.5 rounded-lg border border-sky-800">
                          {item.id}
                        </span>

                        {/* Category */}
                        <span className="font-bold text-slate-200 bg-slate-950 px-2.5 py-0.5 rounded-lg border border-slate-800">
                          {(item.category || 'issue').replace(/_/g, ' ').toUpperCase()}
                        </span>
                        
                        {/* Status */}
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(item.status)}`}>
                          {getStatusLabel(item.status)}
                        </span>
                      </div>

                      {/* Priority */}
                      <div className="flex items-center gap-1 font-mono font-bold text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                        <span>Priority:</span>
                        <span>{item.priorityScore}</span>
                      </div>
                    </div>

                    {/* Row 2: Description */}
                    <p className="text-slate-300 line-clamp-2 italic">
                      "{item.rawInputText || item.cleanDescription}"
                    </p>

                    {/* Row 3: Input Type Badges (Voice, Photo, Text) / Language / Affected Citizens */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-950 text-[11px] text-slate-400">
                      {/* Badges: Input Type & Language */}
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-slate-950 text-sky-300 border border-slate-800 font-semibold flex items-center gap-1">
                          {item.inputType === 'voice' ? <Mic className="w-3 h-3 text-emerald-400" /> : item.inputType === 'photo' ? <Camera className="w-3 h-3 text-sky-400" /> : <FileText className="w-3 h-3 text-indigo-400" />}
                          {(item.inputType || 'text').toUpperCase()}
                        </span>

                        <span className="px-2 py-0.5 rounded bg-slate-950 text-indigo-300 border border-slate-800 font-semibold">
                          {item.language}
                        </span>
                      </div>

                      {/* Affected Citizens & Cluster link */}
                      <div className="flex items-center gap-2">
                        <span className="text-slate-300 font-medium flex items-center gap-1">
                          <Users className="w-3 h-3 text-sky-400" />
                          {item.affectedCitizens} Citizens Merged
                        </span>
                        <span className="text-slate-500 font-mono text-[10px]">
                          ({item.clusterCode})
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ENHANCEMENT 3 & 4: GIS MAP & DETAIL INSPECTOR DRAWER (RIGHT SIDE) */}
          <div className="lg:col-span-6 space-y-4 sticky top-24">
            {/* GIS Map */}
            <div className="h-[360px] rounded-3xl overflow-hidden shadow-xl border border-slate-800">
              <CivicMapView
                clusters={filteredClusters}
                selectedClusterId={selectedClusterId}
                onSelectCluster={onSelectCluster}
                onDispatchCrew={(c) => onDispatchCrew(c, crews[0]?.crewId || 'CREW-01')}
                onVerifyResolve={onOpenVerifyModal}
              />
            </div>

            {/* Selected Master Cluster Card / Detail Drawer */}
            {selectedCluster && (
              <div className="max-h-[400px] overflow-y-auto pr-1">
                <ClusterCard
                  key={selectedCluster.id}
                  cluster={selectedCluster}
                  isSelected={true}
                  onSelect={onSelectCluster}
                  onInspectFormula={onInspectFormula}
                  onDispatchCrew={onDispatchCrew}
                  onOpenVerifyModal={onOpenVerifyModal}
                  availableCrews={crews}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Split View (Existing Layout preserved) */}
      {layoutMode === 'split' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: GIS Map */}
          <div className="lg:col-span-6 sticky top-24 h-[580px]">
            <CivicMapView
              clusters={filteredClusters}
              selectedClusterId={selectedClusterId}
              onSelectCluster={onSelectCluster}
              onDispatchCrew={(c) => onDispatchCrew(c, crews[0]?.crewId || 'CREW-01')}
              onVerifyResolve={onOpenVerifyModal}
            />
          </div>

          {/* Right: Master Cluster Cards List */}
          <div className="lg:col-span-6 space-y-4 max-h-[780px] overflow-y-auto pr-1">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold px-1">
              <span>MASTER DEDUPLICATED CLUSTERS ({filteredClusters.length})</span>
              <span className="text-sky-400">Auto-ranked by NagarAI</span>
            </div>

            {filteredClusters.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
                No civic clusters match your active filters.
              </div>
            ) : (
              filteredClusters.map((cluster) => (
                <ClusterCard
                  key={cluster.id}
                  cluster={cluster}
                  isSelected={cluster.id === selectedClusterId}
                  onSelect={onSelectCluster}
                  onInspectFormula={onInspectFormula}
                  onDispatchCrew={onDispatchCrew}
                  onOpenVerifyModal={onOpenVerifyModal}
                  availableCrews={crews}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Map Only Mode */}
      {layoutMode === 'map' && (
        <div className="h-[680px]">
          <CivicMapView
            clusters={filteredClusters}
            selectedClusterId={selectedClusterId}
            onSelectCluster={onSelectCluster}
            onDispatchCrew={(c) => onDispatchCrew(c, crews[0]?.crewId || 'CREW-01')}
            onVerifyResolve={onOpenVerifyModal}
          />
        </div>
      )}

      {/* Cards List Mode */}
      {layoutMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredClusters.map((cluster) => (
            <ClusterCard
              key={cluster.id}
              cluster={cluster}
              isSelected={cluster.id === selectedClusterId}
              onSelect={onSelectCluster}
              onInspectFormula={onInspectFormula}
              onDispatchCrew={onDispatchCrew}
              onOpenVerifyModal={onOpenVerifyModal}
              availableCrews={crews}
            />
          ))}
        </div>
      )}
    </div>
  );
};
