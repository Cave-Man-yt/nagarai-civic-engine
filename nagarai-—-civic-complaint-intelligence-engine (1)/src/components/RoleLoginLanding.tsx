import React, { useState } from 'react';
import nagarAiLogo from '../assets/images/nagar_ai_logo_1786970773414.jpg';
import { 
  Building2, 
  User, 
  ShieldAlert, 
  Smartphone, 
  Layers, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  MapPin, 
  Mic, 
  Camera, 
  FileText,
  Phone,
  Zap,
  Globe2,
  HeartHandshake,
  Award,
  Wrench,
  Check,
  UserPlus,
  LogIn,
  Star
} from 'lucide-react';
import { UserRole, CitizenUser, OfficerUser, VolunteerUser, VolunteerSkillCategory } from '../types';
import { 
  SAMPLE_EXISTING_CITIZENS, 
  SAMPLE_EXISTING_OFFICERS, 
  SAMPLE_EXISTING_VOLUNTEERS, 
  VOLUNTEER_SKILL_OPTIONS,
  CIVIC_DEPARTMENTS,
  CIVIC_WARDS
} from '../data/mockData';

interface RoleLoginLandingProps {
  onSelectRole: (role: UserRole, user: any) => void;
}

export const RoleLoginLanding: React.FC<RoleLoginLandingProps> = ({ onSelectRole }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Existing User Selection State
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const [loginPhoneOrId, setLoginPhoneOrId] = useState<string>('');

  // New Citizen Registration Form State
  const [newCitizen, setNewCitizen] = useState<CitizenUser>({
    name: '',
    phone: '+91 ',
    email: '',
    ward: CIVIC_WARDS[1], // Ward 7 - T. Nagar
    preferredLanguage: 'Tamil',
    address: '',
    isNewUser: true,
  });

  // New Officer Registration Form State
  const [newOfficer, setNewOfficer] = useState<OfficerUser>({
    name: '',
    phone: '+91 ',
    email: '',
    badgeId: `OFF-${Math.floor(100 + Math.random() * 900)}`,
    department: CIVIC_DEPARTMENTS[0],
    designation: 'Ward Executive Engineer',
    zonalDivision: 'Zone III — Central Division',
    isNewUser: true,
  });

  // New Volunteer Registration Form State (with specific experience)
  const [newVolunteer, setNewVolunteer] = useState<VolunteerUser>({
    id: `VOL-${Math.floor(100 + Math.random() * 900)}`,
    name: '',
    phone: '+91 ',
    email: '',
    ward: CIVIC_WARDS[0],
    primarySkill: 'waste_management',
    skills: ['waste_management'],
    experienceLevel: '1-2 Years Active Volunteer',
    experienceDetails: '',
    ngoAffiliation: '',
    availability: 'Weekends (7 AM - 12 PM)',
    karmaPoints: 100, // Welcome signup bonus
    tasksCompletedCount: 0,
    badges: ['🌱 Fresh Volunteer', '🤝 Nagar Mitra'],
    isNewUser: true,
    joinedAt: new Date().toISOString().split('T')[0],
  });

  // Handle Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedRole === 'citizen') {
      if (authMode === 'login') {
        const existing = SAMPLE_EXISTING_CITIZENS[selectedPresetIndex] || SAMPLE_EXISTING_CITIZENS[0];
        onSelectRole('citizen', existing);
      } else {
        onSelectRole('citizen', {
          ...newCitizen,
          name: newCitizen.name.trim() || 'Citizen User',
          phone: newCitizen.phone.trim() || '+91 98401 55678',
        });
      }
    } else if (selectedRole === 'officer') {
      if (authMode === 'login') {
        const existing = SAMPLE_EXISTING_OFFICERS[selectedPresetIndex] || SAMPLE_EXISTING_OFFICERS[0];
        onSelectRole('officer', existing);
      } else {
        onSelectRole('officer', {
          ...newOfficer,
          name: newOfficer.name.trim() || 'Zonal Officer',
          phone: newOfficer.phone.trim() || '+91 94440 12345',
        });
      }
    } else if (selectedRole === 'volunteer') {
      if (authMode === 'login') {
        const existing = SAMPLE_EXISTING_VOLUNTEERS[selectedPresetIndex] || SAMPLE_EXISTING_VOLUNTEERS[0];
        onSelectRole('volunteer', existing);
      } else {
        onSelectRole('volunteer', {
          ...newVolunteer,
          name: newVolunteer.name.trim() || 'Community Volunteer',
          phone: newVolunteer.phone.trim() || '+91 98402 77112',
          skills: [newVolunteer.primarySkill, ...(newVolunteer.skills || [])],
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-sky-500 selection:text-white">
      {/* Top Ambient Light Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-gradient-to-b from-sky-200/40 via-amber-100/30 to-transparent blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 w-full flex-1 flex flex-col justify-center">
        {/* Top Header & Branding */}
        <div className="text-center space-y-3 mb-8 sm:mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-500 via-sky-500 to-amber-500 p-0.5 shadow-md mb-2">
            <img 
              src={nagarAiLogo} 
              alt="NagarAI Official Logo" 
              className="w-full h-full object-cover rounded-[14px]"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="flex items-center justify-center gap-2">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-sky-600 via-emerald-600 to-amber-600">
              NagarAI
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
              3-Role Civic Ecosystem
            </span>
          </div>

          <p className="text-lg sm:text-xl font-semibold text-slate-800">
            Intelligent Municipal &amp; Community Action Grid
          </p>

          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto font-medium">
            Universal Regional Intake • AI Spatial Deduplication • Skill-Based Volunteer Action • Verified Resolution
          </p>
        </div>

        {/* STEP 1: Role Selection Cards */}
        {!selectedRole ? (
          <div className="space-y-6">
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-600 bg-white px-4 py-1.5 rounded-full border border-slate-200 shadow-sm">
                Select Your Role to Continue
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {/* Role 1: Citizen Card */}
              <div
                onClick={() => {
                  setSelectedRole('citizen');
                  setAuthMode('login');
                }}
                className="group relative p-6 sm:p-7 rounded-3xl bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-emerald-500 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between hover:-translate-y-1"
              >
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                    🏠
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      I am a Citizen
                    </h2>
                    <p className="text-emerald-600 font-semibold text-xs mt-0.5">
                      File &amp; Track Grievances
                    </p>
                  </div>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Submit regional voice notes, live photos, or text in Tamil, Hindi, Telugu, or English. Track live progress and vote to verify resolution.
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] text-slate-600 font-medium">
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-1">
                      <Mic className="w-3 h-3" /> Voice Notes
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-1">
                      <Camera className="w-3 h-3" /> Camera AI
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-1">
                      <Globe2 className="w-3 h-3" /> Multilingual
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-emerald-600 font-bold text-xs">
                  <span>Enter Citizen Portal</span>
                  <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Role 2: Community Volunteer Card */}
              <div
                onClick={() => {
                  setSelectedRole('volunteer');
                  setAuthMode('login');
                }}
                className="group relative p-6 sm:p-7 rounded-3xl bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-amber-500 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between hover:-translate-y-1"
              >
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                    🤝
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                      I am a Volunteer
                    </h2>
                    <p className="text-amber-600 font-semibold text-xs mt-0.5">
                      Fix Small Community Issues
                    </p>
                  </div>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Claim and resolve minor neighborhood issues (litter, small potholes, tree twigs, streetlights) matched to your specific civic skills &amp; earn Karma Badges!
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] text-slate-600 font-medium">
                    <span className="px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-1">
                      <Wrench className="w-3 h-3" /> Skill Matching
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-1">
                      <Award className="w-3 h-3" /> Karma Points
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Quick Fixes
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-amber-600 font-bold text-xs">
                  <span>Enter Volunteer Portal</span>
                  <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Role 3: Municipal Officer Card */}
              <div
                onClick={() => {
                  setSelectedRole('officer');
                  setAuthMode('login');
                }}
                className="group relative p-6 sm:p-7 rounded-3xl bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-sky-500 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between hover:-translate-y-1"
              >
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                    🏛️
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                      I am an Officer
                    </h2>
                    <p className="text-sky-600 font-semibold text-xs mt-0.5">
                      Municipal Command &amp; Crews
                    </p>
                  </div>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Access Municipal GIS War Room, review auto-deduplicated Master Clusters, dispatch emergency repair units, or route small tasks to volunteers.
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] text-slate-600 font-medium">
                    <span className="px-2 py-0.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 flex items-center gap-1">
                      <Layers className="w-3 h-3" /> GIS War Room
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Spatial Merge
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Crew Dispatch
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-sky-600 font-bold text-xs">
                  <span>Enter Officer Portal</span>
                  <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* STEP 2: Unified Auth Form (Existing User Login vs New User Registration) */
          <div className="max-w-xl mx-auto w-full bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-xl space-y-6">
            {/* Top Switcher & Role Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <button
                onClick={() => setSelectedRole(null)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors cursor-pointer"
              >
                &larr; Switch Role
              </button>

              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                selectedRole === 'citizen'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : selectedRole === 'volunteer'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-sky-100 text-sky-800 border border-sky-300'
              }`}>
                {selectedRole === 'citizen'
                  ? '🏠 Citizen Portal'
                  : selectedRole === 'volunteer'
                  ? '🤝 Volunteer Nagar Mitra'
                  : '🏛️ Municipal Officer Portal'}
              </span>
            </div>

            {/* Auth Mode Toggle: Existing User Login vs New User Registration */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  authMode === 'login'
                    ? selectedRole === 'citizen'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : selectedRole === 'volunteer'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Existing User Login</span>
              </button>

              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  authMode === 'register'
                    ? selectedRole === 'citizen'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : selectedRole === 'volunteer'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>New User Registration</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* FLOW A: EXISTING USER LOGIN */}
              {authMode === 'login' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-2">
                      Choose Verified Profile (1-Click Login):
                    </label>

                    {/* Preset Profiles List */}
                    <div className="space-y-2">
                      {selectedRole === 'citizen' &&
                        SAMPLE_EXISTING_CITIZENS.map((user, idx) => (
                          <div
                            key={idx}
                            onClick={() => setSelectedPresetIndex(idx)}
                            className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                              selectedPresetIndex === idx
                                ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                                🏠
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 text-xs">{user.name}</div>
                                <div className="text-[11px] text-slate-600">{user.ward} • {user.phone}</div>
                              </div>
                            </div>
                            {selectedPresetIndex === idx && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            )}
                          </div>
                        ))}

                      {selectedRole === 'officer' &&
                        SAMPLE_EXISTING_OFFICERS.map((user, idx) => (
                          <div
                            key={idx}
                            onClick={() => setSelectedPresetIndex(idx)}
                            className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                              selectedPresetIndex === idx
                                ? 'bg-sky-50 border-sky-500 ring-2 ring-sky-500/20'
                                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-sm">
                                🏛️
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 text-xs">{user.name} ({user.badgeId})</div>
                                <div className="text-[11px] text-slate-600">{user.designation}</div>
                              </div>
                            </div>
                            {selectedPresetIndex === idx && (
                              <CheckCircle2 className="w-4 h-4 text-sky-600" />
                            )}
                          </div>
                        ))}

                      {selectedRole === 'volunteer' &&
                        SAMPLE_EXISTING_VOLUNTEERS.map((user, idx) => {
                          const skillMeta = VOLUNTEER_SKILL_OPTIONS.find(s => s.id === user.primarySkill) || VOLUNTEER_SKILL_OPTIONS[0];
                          return (
                            <div
                              key={idx}
                              onClick={() => setSelectedPresetIndex(idx)}
                              className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                                selectedPresetIndex === idx
                                  ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20'
                                  : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-base">
                                  {skillMeta.icon}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                    <span>{user.name}</span>
                                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500 text-slate-950 font-bold">
                                      {user.karmaPoints} pts
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-600">{skillMeta.label} • {user.experienceLevel}</div>
                                </div>
                              </div>
                              {selectedPresetIndex === idx && (
                                <CheckCircle2 className="w-4 h-4 text-amber-600" />
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Or Manual Phone / ID Input */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-200 text-xs">
                    <label className="text-slate-600 font-medium">Or enter registered Mobile / ID:</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={loginPhoneOrId}
                        onChange={(e) => setLoginPhoneOrId(e.target.value)}
                        placeholder="+91 98401 55678 or Badge ID"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* FLOW B: NEW CITIZEN REGISTRATION FORM */}
              {authMode === 'register' && selectedRole === 'citizen' && (
                <div className="space-y-3.5 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={newCitizen.name}
                      onChange={(e) => setNewCitizen({ ...newCitizen, name: e.target.value })}
                      placeholder="e.g. Meenakshi Sundaram"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Mobile Phone (for SMS / WhatsApp) *</label>
                      <input
                        type="tel"
                        required
                        value={newCitizen.phone}
                        onChange={(e) => setNewCitizen({ ...newCitizen, phone: e.target.value })}
                        placeholder="+91 98401 22334"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Ward / Residential Zone *</label>
                      <select
                        value={newCitizen.ward}
                        onChange={(e) => setNewCitizen({ ...newCitizen, ward: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {CIVIC_WARDS.map((w, i) => (
                          <option key={i} value={w}>{w}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Preferred Intake Language</label>
                      <select
                        value={newCitizen.preferredLanguage}
                        onChange={(e) => setNewCitizen({ ...newCitizen, preferredLanguage: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="Tamil">Tamil (தமிழ்)</option>
                        <option value="Hindi">Hindi (हिन्दी)</option>
                        <option value="Telugu">Telugu (తెలుగు)</option>
                        <option value="English">English</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Landmark / Colony Address</label>
                      <input
                        type="text"
                        value={newCitizen.address}
                        onChange={(e) => setNewCitizen({ ...newCitizen, address: e.target.value })}
                        placeholder="e.g. Near Panagal Park, T. Nagar"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* FLOW C: NEW VOLUNTEER REGISTRATION */}
              {authMode === 'register' && selectedRole === 'volunteer' && (
                <div className="space-y-3.5 text-xs">
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-amber-800">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Volunteer Skill Profile &amp; Experience Setup</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Tell us which specific civic work you are most experienced in so NagarAI can route suitable small community issues to you!
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Volunteer Full Name *</label>
                      <input
                        type="text"
                        required
                        value={newVolunteer.name}
                        onChange={(e) => setNewVolunteer({ ...newVolunteer, name: e.target.value })}
                        placeholder="e.g. Karthik Rajan"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Mobile Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={newVolunteer.phone}
                        onChange={(e) => setNewVolunteer({ ...newVolunteer, phone: e.target.value })}
                        placeholder="+91 98402 77112"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  {/* Primary Specific Skill & Experience Dropdown */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 flex items-center justify-between">
                      <span>Which specific civic work are you most experienced in? *</span>
                      <span className="text-amber-700 font-bold">Primary Skill</span>
                    </label>
                    <select
                      value={newVolunteer.primarySkill}
                      onChange={(e) => setNewVolunteer({ 
                        ...newVolunteer, 
                        primarySkill: e.target.value as VolunteerSkillCategory,
                        skills: [e.target.value as VolunteerSkillCategory] 
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                    >
                      {VOLUNTEER_SKILL_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.icon} {opt.label} — {opt.description.split(',')[0]}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Experience Level & Ward */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Experience Level *</label>
                      <select
                        value={newVolunteer.experienceLevel}
                        onChange={(e) => setNewVolunteer({ ...newVolunteer, experienceLevel: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="Beginner / Enthusiast">Beginner / Enthusiast</option>
                        <option value="1-2 Years Active Volunteer">1-2 Years Active Volunteer</option>
                        <option value="3-5+ Years Civic Specialist">3-5+ Years Civic Specialist</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Assigned Ward Area *</label>
                      <select
                        value={newVolunteer.ward}
                        onChange={(e) => setNewVolunteer({ ...newVolunteer, ward: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        {CIVIC_WARDS.map((w, i) => (
                          <option key={i} value={w}>{w}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Specific Experience Description */}
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">
                      Specific Experience Details &amp; Past Civic Work:
                    </label>
                    <textarea
                      rows={2}
                      value={newVolunteer.experienceDetails}
                      onChange={(e) => setNewVolunteer({ ...newVolunteer, experienceDetails: e.target.value })}
                      placeholder="e.g. Conducted neighborhood cleanups with 20 volunteers, fixed minor colony potholes with cold-mix, and audited streetlights..."
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* NGO & Availability */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">NGO / Civic Club (Optional)</label>
                      <input
                        type="text"
                        value={newVolunteer.ngoAffiliation}
                        onChange={(e) => setNewVolunteer({ ...newVolunteer, ngoAffiliation: e.target.value })}
                        placeholder="e.g. Chennai Volunteers / Youth Club"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Availability Hours</label>
                      <select
                        value={newVolunteer.availability}
                        onChange={(e) => setNewVolunteer({ ...newVolunteer, availability: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="Weekends (7 AM - 12 PM)">Weekends (7 AM - 12 PM)</option>
                        <option value="Evenings (5 PM - 8 PM)">Evenings (5 PM - 8 PM)</option>
                        <option value="Flexible / Emergency On-Call">Flexible / Emergency On-Call</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* FLOW D: NEW OFFICER REGISTRATION */}
              {authMode === 'register' && selectedRole === 'officer' && (
                <div className="space-y-3.5 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Officer Full Name *</label>
                    <input
                      type="text"
                      required
                      value={newOfficer.name}
                      onChange={(e) => setNewOfficer({ ...newOfficer, name: e.target.value })}
                      placeholder="e.g. S. Ramanathan"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Govt Employee / Badge ID *</label>
                      <input
                        type="text"
                        required
                        value={newOfficer.badgeId}
                        onChange={(e) => setNewOfficer({ ...newOfficer, badgeId: e.target.value })}
                        placeholder="OFF-AUTH-8821"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Official Mobile Contact *</label>
                      <input
                        type="tel"
                        required
                        value={newOfficer.phone}
                        onChange={(e) => setNewOfficer({ ...newOfficer, phone: e.target.value })}
                        placeholder="+91 94440 12345"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Municipal Department *</label>
                      <select
                        value={newOfficer.department}
                        onChange={(e) => setNewOfficer({ ...newOfficer, department: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      >
                        {CIVIC_DEPARTMENTS.map((d, i) => (
                          <option key={i} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Designation / Role Title</label>
                      <input
                        type="text"
                        value={newOfficer.designation}
                        onChange={(e) => setNewOfficer({ ...newOfficer, designation: e.target.value })}
                        placeholder="Executive Engineer"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className={`w-full py-3 rounded-xl text-xs font-bold transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer ${
                  selectedRole === 'citizen'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20'
                    : selectedRole === 'volunteer'
                    ? 'bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-slate-950 shadow-amber-500/20'
                    : 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-sky-500/20'
                }`}
              >
                <span>
                  {authMode === 'login' ? 'Sign In to ' : 'Complete Registration & Enter '}
                  {selectedRole === 'citizen' ? 'Citizen Portal' : selectedRole === 'volunteer' ? 'Volunteer Portal' : 'Officer Dashboard'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 bg-white/80 py-4 px-4 text-center text-xs text-slate-500">
        <p>NagarAI Civic Intelligence Engine • Greater Chennai &amp; Bengaluru Smart Municipal Grid</p>
      </footer>
    </div>
  );
};
