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
  Globe2
} from 'lucide-react';

interface RoleLoginLandingProps {
  onSelectRole: (role: 'citizen' | 'officer', user: { name: string; phone: string; department?: string }) => void;
}

export const RoleLoginLanding: React.FC<RoleLoginLandingProps> = ({ onSelectRole }) => {
  const [selectedRole, setSelectedRole] = useState<'citizen' | 'officer' | null>(null);
  const [citizenName, setCitizenName] = useState('');
  const [citizenPhone, setCitizenPhone] = useState('');
  const [officerName, setOfficerName] = useState('');
  const [officerDept, setOfficerDept] = useState('Zonal Municipal Division (Ward 4-15)');
  const [officerPhone, setOfficerPhone] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole === 'citizen') {
      onSelectRole('citizen', {
        name: citizenName.trim() || 'Citizen User',
        phone: citizenPhone.trim() || '+91 90000 00000',
      });
    } else if (selectedRole === 'officer') {
      onSelectRole('officer', {
        name: officerName.trim() || 'Zonal Officer',
        phone: officerPhone.trim() || '+91 90000 00000',
        department: officerDept,
      });
    }
  };


  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-sky-500 selection:text-slate-950">
      {/* Top Ambient Light Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-80 bg-gradient-to-b from-sky-600/15 via-emerald-600/10 to-transparent blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full flex-1 flex flex-col justify-center">
        {/* Top Header & Branding */}
        <div className="text-center space-y-3 mb-10 sm:mb-12">
          {/* Logo Badge */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-500 via-sky-500 to-emerald-500 p-0.5 shadow-xl shadow-sky-950/60 mb-2">
            <img 
              src={nagarAiLogo} 
              alt="NagarAI Official Logo" 
              className="w-full h-full object-cover rounded-[14px]"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="flex items-center justify-center gap-2">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-emerald-300 to-teal-200">
              NagarAI
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30">
              Two-Role Portal
            </span>
          </div>

          <p className="text-lg sm:text-xl font-medium text-slate-200">
            Civic Complaint Intelligence Engine
          </p>

          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Universal Regional Multimodal Intake • Spatial-Semantic Deduplication • Explainable Priority Scoring
          </p>
        </div>

        {/* Role Selection & Auth Flow */}
        {!selectedRole ? (
          <div className="space-y-3 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800">
                Select Your Access Role or Quick Test Login
              </span>
              <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto pt-1">
                <button
                  type="button"
                  onClick={() => onSelectRole('officer', { name: 'Admin Officer', phone: '+91 99999 00001', department: 'Zonal Municipal Division (Ward 4-15)' })}
                  className="px-4 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-200 font-bold text-xs flex items-center gap-2 transition-all shadow-lg hover:scale-105"
                >
                  <Building2 className="w-4 h-4 text-sky-400" />
                  <span>👑 Quick Admin Login (+91 99999 00001)</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectRole('citizen', { name: 'Rajesh Sharma', phone: '+91 98765 43210' })}
                  className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 font-bold text-xs flex items-center gap-2 transition-all shadow-lg hover:scale-105"
                >
                  <User className="w-4 h-4 text-emerald-400" />
                  <span>👤 Quick Citizen Login (+91 98765 43210)</span>
                </button>
              </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto pt-6">
              {/* Role 1: Citizen Card */}
              <div
                onClick={() => setSelectedRole('citizen')}
                className="group relative p-6 sm:p-8 rounded-3xl bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/60 shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between hover:shadow-emerald-950/40 hover:-translate-y-1"
              >
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                    🏠
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                        I am a Citizen
                      </h2>
                    </div>
                    <p className="text-emerald-400 font-semibold text-xs mt-1">
                      File and track complaints
                    </p>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Submit regional voice notes, live photos, or text in Tamil, Hindi, Telugu, or English. Track real-time progress and vote to verify resolution.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-slate-400 font-medium">
                    <span className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-1 text-emerald-300">
                      <Mic className="w-3 h-3" /> Voice Notes
                    </span>
                    <span className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-1 text-emerald-300">
                      <Camera className="w-3 h-3" /> Photo Capture
                    </span>
                    <span className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-1 text-emerald-300">
                      <Globe2 className="w-3 h-3" /> Multilingual
                    </span>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between text-emerald-400 font-bold text-sm">
                  <span>Enter Citizen Portal</span>
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Role 2: Officer Card */}
              <div
                onClick={() => setSelectedRole('officer')}
                className="group relative p-6 sm:p-8 rounded-3xl bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-sky-500/60 shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between hover:shadow-sky-950/40 hover:-translate-y-1"
              >
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                    🏛️
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold text-white group-hover:text-sky-300 transition-colors">
                        I am an Officer
                      </h2>
                    </div>
                    <p className="text-sky-400 font-semibold text-xs mt-1">
                      Manage and resolve issues
                    </p>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Access Municipal GIS War Room, review auto-deduplicated Master Clusters, dispatch field crews, and inspect AI-verified repair photos.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-slate-400 font-medium">
                    <span className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-1 text-sky-300">
                      <Layers className="w-3 h-3" /> GIS Map
                    </span>
                    <span className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-1 text-sky-300">
                      <Zap className="w-3 h-3" /> Priority SLA
                    </span>
                    <span className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-1 text-sky-300">
                      <ShieldAlert className="w-3 h-3" /> Crew Dispatch
                    </span>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between text-sky-400 font-bold text-sm">
                  <span>Enter Zonal Officer Dashboard</span>
                  <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Form Card for Selected Role */
          <div className="max-w-md mx-auto w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <button
                type="button"
                onClick={() => setSelectedRole(null)}
                className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                &larr; Switch Role
              </button>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                selectedRole === 'citizen'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
              }`}>
                {selectedRole === 'citizen' ? '🏠 Citizen Mode' : '🏛️ Officer Mode'}
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">
                {selectedRole === 'citizen' ? 'Citizen Sign In' : 'Municipal Officer Sign In'}
              </h2>
              <p className="text-xs text-slate-400">
                {selectedRole === 'citizen'
                  ? 'Enter your name and phone number to file and track grievances.'
                  : 'Enter your credentials to access the municipal dashboard.'}
              </p>
            </div>

            {/* Quick Auto-Fill Buttons */}
            <div className="pt-1">
              {selectedRole === 'citizen' ? (
                <button
                  type="button"
                  onClick={() => { setCitizenName('Rajesh Sharma'); setCitizenPhone('+91 98765 43210'); }}
                  className="w-full py-1.5 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all"
                >
                  ⚡ Auto-fill Citizen Credentials (Rajesh Sharma)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { setOfficerName('Admin Officer'); setOfficerPhone('+91 99999 00001'); setOfficerDept('Zonal Municipal Division (Ward 4-15)'); }}
                  className="w-full py-1.5 px-3 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-semibold transition-all"
                >
                  ⚡ Auto-fill Admin Officer Credentials
                </button>
              )}
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {selectedRole === 'citizen' ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Citizen Full Name</label>
                    <input
                      type="text"
                      required
                      value={citizenName}
                      onChange={(e) => setCitizenName(e.target.value)}
                      placeholder="e.g. Rajesh Sharma"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Mobile Phone Number (for SMS Alerts)</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                      <input
                        type="tel"
                        required
                        value={citizenPhone}
                        onChange={(e) => setCitizenPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Officer Name</label>
                    <input
                      type="text"
                      required
                      value={officerName}
                      onChange={(e) => setOfficerName(e.target.value)}
                      placeholder="e.g. Admin Officer"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Designation / Zonal Division</label>
                    <input
                      type="text"
                      value={officerDept}
                      onChange={(e) => setOfficerDept(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Official Mobile / ID</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                      <input
                        type="tel"
                        value={officerPhone}
                        onChange={(e) => setOfficerPhone(e.target.value)}
                        placeholder="+91 99999 00001"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                className={`w-full py-3 rounded-xl text-sm font-bold transition-all shadow-lg active:scale-98 flex items-center justify-center gap-2 cursor-pointer ${
                  selectedRole === 'citizen'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20'
                    : 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-sky-500/20'
                }`}
              >
                <span>Continue to {selectedRole === 'citizen' ? 'Citizen Portal' : 'Officer Dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 bg-slate-950/80 py-4 px-4 text-center text-xs text-slate-400">
        <p>NagarAI Civic Intelligence Engine • Greater Chennai & Bengaluru Smart Municipal Grid</p>
      </footer>
    </div>
  );
};
