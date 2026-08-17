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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-50 via-indigo-50/60 to-slate-50 p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-indigo-700" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                Transparent Explainable Priority Scoring Engine
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Non-blackbox, mathematical formula balancing severity, organic volume, aging, and sensitive zone safety
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

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto bg-slate-50/50">
          {/* Active Cluster Breakdown if passed */}
          {cluster && (
            <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-sky-800">{cluster.clusterCode} Breakdown</span>
                <span className="px-3 py-0.5 rounded-full text-xs font-extrabold bg-sky-600 text-white shadow-2xs">
                  Total Score: {cluster.priorityScore} pts
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-2">{cluster.title}</h4>
              <div className="p-3 bg-white rounded-xl font-mono text-xs text-sky-800 border border-sky-200 mb-2 overflow-x-auto shadow-2xs font-semibold">
                {cluster.priorityBreakdown.formulaString}
              </div>
              <p className="text-xs text-slate-600 italic font-medium">{cluster.priorityBreakdown.explanation}</p>
            </div>
          )}

          {/* Mathematical Formula Definition Box */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Standardized NagarAI Priority Equation
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-sm sm:text-base text-center text-emerald-700 font-extrabold overflow-x-auto">
              Score = [ (Severity &times; 15) + (ln(Affected + 1) &times; 14) + (Days &times; 5) + Proximity_Boost ] &times; Life_Hazard_Multiplier
            </div>

            {/* Variable definitions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-xs text-slate-600">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900">1. Base Severity (1 - 5):</span>
                <p className="text-slate-500 mt-0.5">Scale &times; 15 pts. Class 5 (Electrocution / Deep Hole) = 75 pts. Class 1 = 15 pts.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900">2. Organic Citizen Volume (Logarithmic):</span>
                <p className="text-slate-500 mt-0.5">ln(N + 1) &times; 14 pts. Prevents spam-brigades while rewarding multi-person impact.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900">3. Aging Pressure (+5 pts/day):</span>
                <p className="text-slate-500 mt-0.5">Automated SLA escalation ensuring neglected tickets steadily rise in queue rank.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900">4. Sensitive Zone Proximity:</span>
                <p className="text-slate-500 mt-0.5">+25 pts if Hospital &le; 500m, +18 pts if School &le; 300m, +10 pts if Transit Hub.</p>
              </div>
            </div>
          </div>

          {/* Side-by-Side Worked Example */}
          <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-200">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-800 mb-2">
              {workedExample.title}
            </div>
            <p className="text-xs text-slate-600 mb-4 font-medium">{workedExample.insight}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Case A */}
              <div className="p-4 rounded-xl bg-white border border-rose-300 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-rose-700">⚡ {workedExample.caseA.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-rose-600 text-white">
                    Rank #1 ({workedExample.caseA.score} pts)
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mb-2 font-medium">{workedExample.caseA.params}</div>
                <div className="p-2.5 bg-rose-50 rounded-lg font-mono text-[11px] text-rose-800 font-semibold mb-2 overflow-x-auto border border-rose-200">
                  {workedExample.caseA.math}
                </div>
                <p className="text-xs text-slate-600 italic">{workedExample.caseA.why}</p>
              </div>

              {/* Case B */}
              <div className="p-4 rounded-xl bg-white border border-amber-300 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-700">🕳️ {workedExample.caseB.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-amber-500 text-slate-950 font-bold">
                    Rank #2 ({workedExample.caseB.score} pts)
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mb-2 font-medium">{workedExample.caseB.params}</div>
                <div className="p-2.5 bg-amber-50 rounded-lg font-mono text-[11px] text-amber-900 font-semibold mb-2 overflow-x-auto border border-amber-200">
                  {workedExample.caseB.math}
                </div>
                <p className="text-xs text-slate-600 italic">{workedExample.caseB.why}</p>
              </div>
            </div>
          </div>

          {/* Interactive Calculator Sandbox */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <div className="text-xs font-bold uppercase tracking-wider text-sky-700 mb-4 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-sky-600" />
              Interactive Formula Simulation Sandbox
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sliders & Controls */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs text-slate-600 mb-1 font-medium">
                    <span>Severity (1-5):</span>
                    <span className="font-bold text-slate-900">{simSeverity} / 5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={simSeverity}
                    onChange={(e) => setSimSeverity(Number(e.target.value))}
                    className="w-full accent-sky-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-600 mb-1 font-medium">
                    <span>Affected Citizens Count:</span>
                    <span className="font-bold text-slate-900">{simCitizens} Citizens</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={simCitizens}
                    onChange={(e) => setSimCitizens(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-600 mb-1 font-medium">
                    <span>Days Pending (Aging):</span>
                    <span className="font-bold text-slate-900">{simDays} Days</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={simDays}
                    onChange={(e) => setSimDays(Number(e.target.value))}
                    className="w-full accent-amber-600 cursor-pointer"
                  />
                </div>

                {/* Proximity Toggles */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="text-xs font-semibold text-slate-600">Proximity Buffer Boosts:</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSimHasSchool(!simHasSchool)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        simHasSchool ? 'bg-sky-100 border-sky-300 text-sky-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      🏫 School &le; 300m (+18 pts)
                    </button>

                    <button
                      onClick={() => setSimHasHospital(!simHasHospital)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        simHasHospital ? 'bg-rose-100 border-rose-300 text-rose-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      🏥 Hospital &le; 500m (+25 pts)
                    </button>

                    <button
                      onClick={() => setSimIsLifeHazard(!simIsLifeHazard)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        simIsLifeHazard ? 'bg-amber-100 border-amber-300 text-amber-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      ⚡ Life Threat Multiplier (1.4x)
                    </button>
                  </div>
                </div>
              </div>

              {/* Real-time Math Output Card */}
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between shadow-2xs">
                <div>
                  <div className="text-xs text-slate-500 uppercase font-bold mb-1">Calculated Priority Score</div>
                  <div className="text-4xl font-extrabold text-slate-900 font-mono flex items-center gap-3">
                    <span className={calculated.totalScore >= 130 ? 'text-rose-600' : calculated.totalScore >= 90 ? 'text-amber-600' : 'text-sky-700'}>
                      {calculated.totalScore}
                    </span>
                    <span className="text-xs font-normal text-slate-500">/ 200+</span>
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs text-slate-600 font-medium">
                    <div className="flex justify-between">
                      <span>Severity Component:</span>
                      <span className="font-mono text-slate-900 font-bold">+{calculated.severityScore} pts</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Citizen Volume Component:</span>
                      <span className="font-mono text-indigo-700 font-bold">+{calculated.citizenMultiplier} pts</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Aging Delay Component:</span>
                      <span className="font-mono text-amber-700 font-bold">+{calculated.agingScore} pts</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Proximity Boost:</span>
                      <span className="font-mono text-emerald-700 font-bold">+{calculated.proximityBoost} pts</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-1">
                      <span>Life Hazard Multiplier:</span>
                      <span className="font-mono text-rose-700 font-bold">&times; {calculated.lifeThreatMultiplier}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-2.5 bg-white rounded-lg text-[11px] font-mono text-slate-600 border border-slate-200 overflow-x-auto">
                  {calculated.formulaString}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer shadow-2xs"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
