import React, { useState, useMemo } from 'react';
import { 
  HeartHandshake, 
  Award, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Wrench, 
  Filter, 
  Search, 
  ArrowRight, 
  Camera, 
  Upload, 
  AlertCircle, 
  ShieldCheck, 
  Users, 
  ChevronRight, 
  LogOut, 
  Flame, 
  Trash2, 
  Zap, 
  Droplet, 
  TreePine, 
  TrafficCone, 
  Smile, 
  Star,
  Check,
  Share2
} from 'lucide-react';
import { VolunteerUser, VolunteerTask, MasterCluster, VolunteerSkillCategory } from '../types';
import { VOLUNTEER_SKILL_OPTIONS, SAMPLE_CIVIC_PHOTOS, SAMPLE_EXISTING_VOLUNTEERS } from '../data/mockData';

interface VolunteerPortalProps {
  volunteerUser: VolunteerUser;
  volunteerTasks: VolunteerTask[];
  onClaimTask: (taskId: string) => void;
  onSubmitResolutionProof: (taskId: string, proof: {
    afterPhotoUrl: string;
    notes: string;
    aiScore: number;
  }) => void;
  onLogout: () => void;
}

export const VolunteerPortal: React.FC<VolunteerPortalProps> = ({
  volunteerUser,
  volunteerTasks,
  onClaimTask,
  onSubmitResolutionProof,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'recommended' | 'all' | 'my_tasks' | 'resolved' | 'leaderboard'>('recommended');
  const [selectedWardFilter, setSelectedWardFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modal state for submitting completion proof
  const [resolvingTask, setResolvingTask] = useState<VolunteerTask | null>(null);
  const [proofPhotoUrl, setProofPhotoUrl] = useState<string>(SAMPLE_CIVIC_PHOTOS.resolved_garbage);
  const [resolutionNotes, setResolutionNotes] = useState<string>('Cleared all plastic waste and placed in municipal sorting bags. Footpath completely unobstructed.');
  const [isVerifyingProof, setIsVerifyingProof] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<{ score: number; summary: string } | null>(null);

  // Skill metadata
  const primarySkillMeta = useMemo(() => {
    return VOLUNTEER_SKILL_OPTIONS.find((s) => s.id === volunteerUser.primarySkill) || VOLUNTEER_SKILL_OPTIONS[0];
  }, [volunteerUser.primarySkill]);

  // Tasks Filtered logic
  const filteredTasks = useMemo(() => {
    let list = [...volunteerTasks];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.locationName.toLowerCase().includes(q) ||
          t.ward.toLowerCase().includes(q)
      );
    }

    // Ward filter
    if (selectedWardFilter !== 'all') {
      list = list.filter((t) => t.ward.includes(selectedWardFilter));
    }

    // Tab filter
    if (activeTab === 'recommended') {
      // Prioritize tasks that match the volunteer's primary or secondary skills
      list = list.filter((t) => {
        const matchesSkill = t.requiredSkill === volunteerUser.primarySkill || (volunteerUser.skills || []).includes(t.requiredSkill as any);
        return matchesSkill && t.status !== 'volunteer_resolved';
      });
    } else if (activeTab === 'my_tasks') {
      list = list.filter((t) => 
        t.pledgedVolunteers?.some((p) => p.phone === volunteerUser.phone || p.name === volunteerUser.name)
      );
    } else if (activeTab === 'resolved') {
      list = list.filter((t) => t.status === 'volunteer_resolved');
    } else if (activeTab === 'all') {
      list = list.filter((t) => t.status === 'open_for_volunteers' || t.status === 'in_progress');
    }

    return list;
  }, [volunteerTasks, searchQuery, selectedWardFilter, activeTab, volunteerUser]);

  // Handle Resolution Submission
  const handleVerifyAndSubmit = () => {
    if (!resolvingTask) return;
    setIsVerifyingProof(true);

    setTimeout(() => {
      const score = Math.floor(94 + Math.random() * 5); // 94% - 98%
      const summary = `AI Vision Resolution Confirmed (${score}%). No residual hazard detected. Hazard category: ${resolvingTask.category}. Awarded +${resolvingTask.karmaPoints} Civic Karma Points.`;
      
      setVerificationResult({ score, summary });
      setIsVerifyingProof(false);

      setTimeout(() => {
        onSubmitResolutionProof(resolvingTask.id, {
          afterPhotoUrl: proofPhotoUrl,
          notes: resolutionNotes,
          aiScore: score,
        });
        setResolvingTask(null);
        setVerificationResult(null);
      }, 1400);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-900">
      {/* Top Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-64 bg-gradient-to-b from-amber-500/10 via-emerald-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-emerald-600 p-0.5 shadow-xs flex items-center justify-center">
                <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center text-amber-600">
                  <HeartHandshake className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black tracking-tight text-slate-900">NagarAI</h1>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                    Nagar Mitra
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Volunteer Portal
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Small Community Tasks • Hyperlocal Rapid Action • Skill-Based Matching
                </p>
              </div>
            </div>

            {/* User Karma Stats & Logout */}
            <div className="flex items-center gap-3">
              {/* Karma Badge Pill */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 shadow-2xs">
                <Award className="w-4 h-4 text-amber-600" />
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-amber-700 leading-none">Karma Score</div>
                  <div className="text-sm font-black text-amber-800 font-mono leading-tight">
                    {volunteerUser.karmaPoints} pts
                  </div>
                </div>
              </div>

              {/* Volunteer Identity & Logout */}
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 text-xs">
                <div className="text-right">
                  <div className="font-bold text-slate-900">{volunteerUser.name}</div>
                  <div className="text-[11px] text-slate-500">{volunteerUser.ward}</div>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                title="Switch Role / Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Switch Role</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 w-full">
        {/* Volunteer Profile Banner with Specialized Experience */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-50 via-white to-emerald-50/60 border border-amber-200 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left: Info & Badges */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-2xl">{primarySkillMeta.icon}</span>
                <h2 className="text-2xl font-black text-slate-900">{volunteerUser.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  {primarySkillMeta.label}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                  {volunteerUser.experienceLevel}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed font-medium">
                <b>Civic Expertise &amp; Background:</b> "{volunteerUser.experienceDetails || 'Active community volunteer specializing in neighborhood civic enhancements.'}"
              </p>

              {volunteerUser.ngoAffiliation && (
                <div className="text-xs text-amber-800 flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Affiliated with <b>{volunteerUser.ngoAffiliation}</b></span>
                  <span>• Availability: {volunteerUser.availability}</span>
                </div>
              )}
            </div>

            {/* Right: Key Stats Counters */}
            <div className="grid grid-cols-3 gap-2 shrink-0">
              <div className="p-3 rounded-2xl bg-white border border-slate-200 text-center shadow-2xs">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Karma Points</div>
                <div className="text-xl font-black text-amber-700 font-mono">{volunteerUser.karmaPoints}</div>
              </div>
              <div className="p-3 rounded-2xl bg-white border border-slate-200 text-center shadow-2xs">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Tasks Done</div>
                <div className="text-xl font-black text-emerald-700 font-mono">{volunteerUser.tasksCompletedCount}</div>
              </div>
              <div className="p-3 rounded-2xl bg-white border border-slate-200 text-center shadow-2xs">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Badges</div>
                <div className="text-xl font-black text-sky-700 font-mono">{volunteerUser.badges?.length || 3}</div>
              </div>
            </div>
          </div>

          {/* Badges Strip */}
          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Earned Badges:</span>
            {(volunteerUser.badges || ['🌿 Green Champion', '⭐ Civic Hero', '🚀 Rapid Fixer']).map((b, i) => (
              <span key={i} className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-white text-slate-700 border border-slate-200 shadow-2xs flex items-center gap-1">
                {b}
              </span>
            ))}
          </div>
        </div>

        {/* Skill Match Advisory Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/40 to-sky-50 border border-emerald-200 flex items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>Skill-Based Smart Task Matching Engine Active</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {primarySkillMeta.label}
                </span>
              </div>
              <p className="text-slate-600 text-xs mt-0.5 font-medium">
                Minor civic issues with Severity 1–2 (which do not require heavy municipality machinery or road rollers) are automatically assigned to volunteers with matching experience!
              </p>
            </div>
          </div>

          <span className="hidden md:inline-flex px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold whitespace-nowrap">
            {volunteerTasks.filter(t => t.status === 'open_for_volunteers').length} Tasks Available
          </span>
        </div>

        {/* Navigation Tabs & Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
            <button
              onClick={() => setActiveTab('recommended')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'recommended'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Recommended for My Skills</span>
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <span>All Open Tasks</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-200 text-slate-700">
                {volunteerTasks.filter((t) => t.status === 'open_for_volunteers').length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('my_tasks')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
                activeTab === 'my_tasks'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <span>My Claimed Tasks</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-100 text-amber-800 border border-amber-200">
                {volunteerTasks.filter((t) => t.pledgedVolunteers?.some((p) => p.phone === volunteerUser.phone || p.name === volunteerUser.name)).length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('resolved')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
                activeTab === 'resolved'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Resolved by Volunteers</span>
            </button>

            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
                activeTab === 'leaderboard'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-600" />
              <span>Ward Leaderboard</span>
            </button>
          </div>

          {/* Search & Ward Filter */}
          {activeTab !== 'leaderboard' && (
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search task or ward..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                />
              </div>

              <select
                value={selectedWardFilter}
                onChange={(e) => setSelectedWardFilter(e.target.value)}
                className="text-xs bg-white text-slate-700 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs cursor-pointer"
              >
                <option value="all">All Wards</option>
                <option value="Anna Nagar">Ward 4 - Anna Nagar</option>
                <option value="T. Nagar">Ward 10 - T. Nagar</option>
                <option value="Mylapore">Ward 15 - Mylapore</option>
                <option value="Ring Road">Ward 8 - Ring Road</option>
              </select>
            </div>
          )}
        </div>

        {/* TAB 1: Tasks Feed (Recommended / All / My Tasks / Resolved) */}
        {activeTab !== 'leaderboard' && (
          <div className="space-y-4">
            {filteredTasks.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 text-slate-600 space-y-3 shadow-2xs">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 mx-auto flex items-center justify-center text-slate-400 text-2xl">
                  📋
                </div>
                <h3 className="text-base font-bold text-slate-900">No Matching Community Tasks Found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Try switching tabs or resetting your search filter. New minor civic tasks are routed from citizen complaints automatically.
                </p>
                <button
                  onClick={() => {
                    setActiveTab('all');
                    setSelectedWardFilter('all');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors cursor-pointer shadow-2xs"
                >
                  View All Open Civic Tasks
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredTasks.map((task) => {
                  const isClaimedByMe = task.pledgedVolunteers?.some(
                    (p) => p.phone === volunteerUser.phone || p.name === volunteerUser.name
                  );
                  const isSkillMatch = task.requiredSkill === volunteerUser.primarySkill;
                  const isResolved = task.status === 'volunteer_resolved';

                  return (
                    <div
                      key={task.id}
                      className={`p-5 rounded-3xl border transition-all duration-200 flex flex-col justify-between space-y-4 ${
                        isResolved
                          ? 'bg-white border-emerald-200 shadow-2xs opacity-95'
                          : isClaimedByMe
                          ? 'bg-amber-50/40 border-amber-300 ring-2 ring-amber-400/20 shadow-md'
                          : isSkillMatch
                          ? 'bg-white border-emerald-300 hover:border-emerald-400 shadow-sm hover:shadow-md'
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-xs'
                      }`}
                    >
                      {/* Top Header & Skill Match Badge */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-[11px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                              {task.clusterCode}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              Severity {task.severity}/5 (Minor)
                            </span>
                          </div>

                          {/* Skill Match Tag */}
                          {isSkillMatch && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                              Skill Match
                            </span>
                          )}

                          {isResolved && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Resolved
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-slate-900 leading-snug">
                          {task.title}
                        </h3>

                        <p className="text-xs text-slate-600 leading-relaxed font-medium">
                          {task.description}
                        </p>
                      </div>

                      {/* Location & Meta info */}
                      <div className="space-y-3 pt-3 border-t border-slate-200 text-xs">
                        <div className="flex items-start gap-1.5 text-slate-700">
                          <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-slate-900">{task.locationName}</div>
                            <div className="text-[11px] text-slate-500 font-medium">{task.ward}</div>
                          </div>
                        </div>

                        {/* Estimated Time, Difficulty & Recommended Tools */}
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-1.5 text-slate-700 font-medium">
                            <Clock className="w-3.5 h-3.5 text-sky-600" />
                            <span>{task.estimatedMinutes} mins • {task.difficulty}</span>
                          </div>

                          <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-1.5 text-amber-800 font-bold font-mono">
                            <Award className="w-3.5 h-3.5 text-amber-600" />
                            <span>+{task.karmaPoints} Karma Pts</span>
                          </div>
                        </div>

                        {/* Tools Recommended */}
                        {task.toolsRecommended && task.toolsRecommended.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-600">
                            <Wrench className="w-3 h-3 text-slate-400" />
                            <span className="text-slate-500 font-medium">Tools:</span>
                            {task.toolsRecommended.map((t, idx) => (
                              <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Resolution Showcase if Resolved */}
                        {isResolved && task.resolvedBy && (
                          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800">
                              <span>Verified by AI ({task.resolvedBy.aiVerificationScore}%)</span>
                              <span className="text-slate-600">{task.resolvedBy.volunteerName}</span>
                            </div>
                            <p className="text-[11px] text-slate-700 italic font-medium">
                              "{task.resolvedBy.notes}"
                            </p>
                            {task.resolvedBy.afterPhotoUrl && (
                              <div className="flex items-center gap-2">
                                <img
                                  src={task.resolvedBy.afterPhotoUrl}
                                  alt="Resolution Proof"
                                  className="w-16 h-12 object-cover rounded-lg border border-emerald-300"
                                />
                                <span className="text-[10px] text-emerald-700 font-bold">After-Cleanup Proof Uploaded</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="pt-2">
                        {isResolved ? (
                          <div className="w-full py-2 text-center text-xs font-bold text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Task Completed &amp; Verified</span>
                          </div>
                        ) : isClaimedByMe ? (
                          <button
                            onClick={() => setResolvingTask(task)}
                            className="w-full py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                          >
                            <Camera className="w-4 h-4" />
                            <span>Submit Completion Proof &amp; Earn +{task.karmaPoints} Pts</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onClaimTask(task.id)}
                            className="w-full py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                          >
                            <HeartHandshake className="w-4 h-4" />
                            <span>Claim This Task</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Ward Volunteer Leaderboard */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-600" />
                    Greater Municipal Ward Karma Honor Board
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Recognizing citizens and volunteers resolving neighborhood community issues.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Monthly Cycle: August 2026
                </span>
              </div>

              {/* Leaderboard Table */}
              <div className="space-y-2.5">
                {[volunteerUser, ...SAMPLE_EXISTING_VOLUNTEERS.filter(v => v.phone !== volunteerUser.phone)]
                  .sort((a, b) => b.karmaPoints - a.karmaPoints)
                  .map((vol, rank) => {
                    const isCurrentUser = vol.phone === volunteerUser.phone;
                    const skillMeta = VOLUNTEER_SKILL_OPTIONS.find((s) => s.id === vol.primarySkill) || VOLUNTEER_SKILL_OPTIONS[0];

                    return (
                      <div
                        key={vol.id || rank}
                        className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                          isCurrentUser
                            ? 'bg-amber-50/70 border-amber-300 shadow-xs'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black font-mono text-sm ${
                            rank === 0
                              ? 'bg-amber-400 text-slate-950 shadow-xs shadow-amber-500/20'
                              : rank === 1
                              ? 'bg-slate-300 text-slate-950'
                              : rank === 2
                              ? 'bg-amber-700 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}>
                            {rank + 1}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{vol.name}</span>
                              {isCurrentUser && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950">
                                  You
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded text-[10px] bg-white text-slate-700 border border-slate-200 flex items-center gap-1 shadow-2xs font-medium">
                                <span>{skillMeta.icon}</span>
                                <span>{skillMeta.label}</span>
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 font-medium">{vol.ward} • {vol.experienceLevel}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 pl-11 sm:pl-0">
                          <div className="text-right">
                            <div className="text-[10px] text-slate-500 uppercase font-bold">Tasks Completed</div>
                            <div className="font-bold text-emerald-700 font-mono text-sm">{vol.tasksCompletedCount}</div>
                          </div>

                          <div className="text-right">
                            <div className="text-[10px] text-slate-500 uppercase font-bold">Karma Points</div>
                            <div className="font-black text-amber-800 font-mono text-base">{vol.karmaPoints} pts</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: Submit Completion Proof */}
      {resolvingTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-amber-800 text-xs bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                  {resolvingTask.clusterCode}
                </span>
                <h3 className="text-base font-bold text-slate-900">Submit Resolution Proof</h3>
              </div>
              <button
                onClick={() => setResolvingTask(null)}
                className="text-xs text-slate-600 hover:text-slate-900 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors font-medium"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-1">
              <div className="text-sm font-bold text-slate-900">{resolvingTask.title}</div>
              <p className="text-xs text-slate-500 font-medium">{resolvingTask.locationName} • {resolvingTask.ward}</p>
            </div>

            {/* Photo Selection Preview */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">
                1. Select / Upload Post-Resolution Photo Proof:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div
                  onClick={() => setProofPhotoUrl(SAMPLE_CIVIC_PHOTOS.resolved_garbage)}
                  className={`p-2 rounded-2xl border cursor-pointer transition-all ${
                    proofPhotoUrl === SAMPLE_CIVIC_PHOTOS.resolved_garbage
                      ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img
                    src={SAMPLE_CIVIC_PHOTOS.resolved_garbage}
                    alt="Cleaned Park"
                    className="w-full h-24 object-cover rounded-xl mb-1.5"
                  />
                  <div className="text-[11px] font-bold text-slate-800">Sample Clean Ground</div>
                  <div className="text-[10px] text-emerald-700 font-semibold">Cleaned &amp; De-littered</div>
                </div>

                <div
                  onClick={() => setProofPhotoUrl(SAMPLE_CIVIC_PHOTOS.resolved_road)}
                  className={`p-2 rounded-2xl border cursor-pointer transition-all ${
                    proofPhotoUrl === SAMPLE_CIVIC_PHOTOS.resolved_road
                      ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img
                    src={SAMPLE_CIVIC_PHOTOS.resolved_road}
                    alt="Patched Road"
                    className="w-full h-24 object-cover rounded-xl mb-1.5"
                  />
                  <div className="text-[11px] font-bold text-slate-800">Sample Patched Surface</div>
                  <div className="text-[10px] text-emerald-700 font-semibold">Cold-Mix Patched</div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                2. Resolution Summary &amp; Steps Taken:
              </label>
              <textarea
                rows={2}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Describe how the small civic issue was resolved..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Verification Result Banner if active */}
            {verificationResult && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-800 flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{verificationResult.summary}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              disabled={isVerifyingProof}
              onClick={handleVerifyAndSubmit}
              className="w-full py-3 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {isVerifyingProof ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Auditing Photo Proof with AI Vision...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Verify with AI &amp; Claim +{resolvingTask.karmaPoints} Karma Points</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
