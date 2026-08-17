import React, { useState } from 'react';
import { 
  X, 
  Calculator, 
  Sparkles, 
  ShieldAlert, 
  Users, 
  Clock, 
  MapPin, 
  ArrowRight,
  Info,
  Check
} from 'lucide-react';
import { MasterCluster, ComplaintCategory } from '../types';
import { calculatePriorityScore, getWorkedExample, DEFAULT_WEIGHTS } from '../utils/priorityEngine';

interface PriorityFormulaModalProps {
  cluster?: MasterCluster | null;
  onClose: () => void;
}

export const PriorityFormulaModal: React.FC<PriorityFormulaModalProps> = ({ cluster, onClose }) => {
  const workedExample = getWorkedExample();

  // Interactive Calculator Sandbox State
  const [simSeverity, setSimSeverity] = useState<number>(cluster?.baseSeverity || 4);
  const [simCitizens, setSimCitizens] = useState<number>(cluster?.affectedCitizenCount || 3);
  const [simDays, setSimDays] = useState<number>(cluster?.daysPending || 1);
  const [simHasSchool, setSimHasSchool] = useState<boolean>(true);
  const [simHasHospital, setSimHasHospital] = useState<boolean>(false);
  const [simIsLifeHazard, setSimIsLifeHazard] = useState<boolean>(cluster?.category === 'live_wire_hazard' || cluster?.category === 'open_manhole');
  const [simCategory, setSimCategory] = useState<ComplaintCategory>(cluster?.category || 'pothole');

  const simulatedLandmarks = [
    ...(simHasHospital ? [{ name: 'City Hospital', type: 'hospital' as const, distanceMeters: 250 }] : []),
    ...(simHasSchool ? [{ name: 'Kendriya Vidyalaya School', type: 'school' as const, distanceMeters: 120 }] : []),
  ];

  const calculated = calculatePriorityScore(
    simSeverity,
    simCitizens,
    simDays,
    simIsLifeHazard ? 'live_wire_hazard' : simCategory,
    simulatedLandmarks
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Transparent Explainable Priority Scoring Engine
              </h2>
              <p className="text-xs text-slate-400">
                Non-blackbox, mathematical formula balancing severity, organic volume, aging, and sensitive zone safety
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

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Active Cluster Breakdown if passed */}
          {cluster && (
            <div className="p-4 rounded-2xl bg-sky-950/40 border border-sky-800/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-sky-400">{cluster.clusterCode} Breakdown</span>
                <span className="px-3 py-0.5 rounded-full text-xs font-extrabold bg-sky-500 text-slate-950">
                  Total Score: {cluster.priorityScore} pts
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mb-2">{cluster.title}</h4>
              <div className="p-3 bg-slate-900/90 rounded-xl font-mono text-xs text-sky-300 border border-slate-800 mb-2 overflow-x-auto">
                {cluster.priorityBreakdown.formulaString}
              </div>
              <p className="text-xs text-slate-300 italic">{cluster.priorityBreakdown.explanation}</p>
            </div>
          )}

          {/* Mathematical Formula Definition Box */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Standardized NagarAI Priority Equation
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-700/60 font-mono text-sm sm:text-base text-center text-emerald-400 font-bold overflow-x-auto">
              Score = [ (Severity &times; 15) + (ln(Affected + 1) &times; 14) + (Days &times; 5) + Proximity_Boost ] &times; Life_Hazard_Multiplier
            </div>

            {/* Variable definitions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="font-bold text-white">1. Base Severity (1 - 5):</span>
                <p className="text-slate-400 mt-0.5">Scale &times; 15 pts. Class 5 (Electrocution / Deep Hole) = 75 pts. Class 1 = 15 pts.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="font-bold text-white">2. Organic Citizen Volume (Logarithmic):</span>
                <p className="text-slate-400 mt-0.5">ln(N + 1) &times; 14 pts. Prevents spam-brigades while rewarding multi-person impact.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="font-bold text-white">3. Aging Pressure (+5 pts/day):</span>
                <p className="text-slate-400 mt-0.5">Automated SLA escalation ensuring neglected tickets steadily rise in queue rank.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="font-bold text-white">4. Sensitive Zone Proximity:</span>
                <p className="text-slate-400 mt-0.5">+25 pts if Hospital &le; 500m, +18 pts if School &le; 300m, +10 pts if Transit Hub.</p>
              </div>
            </div>
          </div>

          {/* Side-by-Side Worked Example */}
          <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-800/40">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-2">
              {workedExample.title}
            </div>
            <p className="text-xs text-slate-300 mb-4">{workedExample.insight}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Case A */}
              <div className="p-4 rounded-xl bg-slate-900 border border-rose-500/40">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-rose-400">⚡ {workedExample.caseA.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-rose-500 text-white">
                    Rank #1 ({workedExample.caseA.score} pts)
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mb-2">{workedExample.caseA.params}</div>
                <div className="p-2.5 bg-slate-950 rounded-lg font-mono text-[11px] text-rose-300 mb-2 overflow-x-auto">
                  {workedExample.caseA.math}
                </div>
                <p className="text-xs text-slate-300 italic">{workedExample.caseA.why}</p>
              </div>

              {/* Case B */}
              <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/40">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-400">🕳️ {workedExample.caseB.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-amber-500 text-slate-950">
                    Rank #2 ({workedExample.caseB.score} pts)
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mb-2">{workedExample.caseB.params}</div>
                <div className="p-2.5 bg-slate-950 rounded-lg font-mono text-[11px] text-amber-300 mb-2 overflow-x-auto">
                  {workedExample.caseB.math}
                </div>
                <p className="text-xs text-slate-300 italic">{workedExample.caseB.why}</p>
              </div>
            </div>
          </div>

          {/* Interactive Calculator Sandbox */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="text-xs font-bold uppercase tracking-wider text-sky-400 mb-4 flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Interactive Formula Simulation Sandbox
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sliders & Controls */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Severity (1-5):</span>
                    <span className="font-bold text-white">{simSeverity} / 5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={simSeverity}
                    onChange={(e) => setSimSeverity(Number(e.target.value))}
                    className="w-full accent-sky-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Affected Citizens Count:</span>
                    <span className="font-bold text-white">{simCitizens} Citizens</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={simCitizens}
                    onChange={(e) => setSimCitizens(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Days Pending (Aging):</span>
                    <span className="font-bold text-white">{simDays} Days</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={simDays}
                    onChange={(e) => setSimDays(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* Proximity Toggles */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="text-xs font-semibold text-slate-400">Proximity Buffer Boosts:</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSimHasSchool(!simHasSchool)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                        simHasSchool ? 'bg-sky-500/20 border-sky-500 text-sky-300' : 'bg-slate-900 border-slate-700 text-slate-400'
                      }`}
                    >
                      🏫 School &le; 300m (+18 pts)
                    </button>

                    <button
                      onClick={() => setSimHasHospital(!simHasHospital)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                        simHasHospital ? 'bg-rose-500/20 border-rose-500 text-rose-300' : 'bg-slate-900 border-slate-700 text-slate-400'
                      }`}
                    >
                      🏥 Hospital &le; 500m (+25 pts)
                    </button>

                    <button
                      onClick={() => setSimIsLifeHazard(!simIsLifeHazard)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                        simIsLifeHazard ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-900 border-slate-700 text-slate-400'
                      }`}
                    >
                      ⚡ Life Threat Multiplier (1.4x)
                    </button>
                  </div>
                </div>
              </div>

              {/* Real-time Math Output Card */}
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-700 flex flex-col justify-between">
                <div>
                  <div className="text-xs text-slate-400 uppercase font-bold mb-1">Calculated Priority Score</div>
                  <div className="text-4xl font-extrabold text-white font-mono flex items-center gap-3">
                    <span className={calculated.totalScore >= 130 ? 'text-rose-400' : calculated.totalScore >= 90 ? 'text-orange-400' : 'text-sky-400'}>
                      {calculated.totalScore}
                    </span>
                    <span className="text-xs font-normal text-slate-400">/ 200+</span>
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span>Severity Component:</span>
                      <span className="font-mono text-white">+{calculated.severityScore} pts</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Citizen Volume Component:</span>
                      <span className="font-mono text-indigo-300">+{calculated.citizenMultiplier} pts</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Aging Delay Component:</span>
                      <span className="font-mono text-amber-300">+{calculated.agingScore} pts</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Proximity Boost:</span>
                      <span className="font-mono text-emerald-300">+{calculated.proximityBoost} pts</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800 pt-1">
                      <span>Life Hazard Multiplier:</span>
                      <span className="font-mono text-rose-300">&times; {calculated.lifeThreatMultiplier}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-2.5 bg-slate-950 rounded-lg text-[11px] font-mono text-slate-400 overflow-x-auto">
                  {calculated.formulaString}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
