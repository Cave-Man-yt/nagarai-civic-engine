import { ComplaintCategory, LandmarkPOI, PriorityBreakdown } from '../types';

export interface PriorityWeights {
  severityWeight: number; // default 15
  citizenWeight: number; // default 14
  agingRatePerDay: number; // default 5
  schoolDistanceThreshold: number; // default 300m -> +15
  hospitalDistanceThreshold: number; // default 500m -> +25
  transitDistanceThreshold: number; // default 250m -> +10
  lifeThreatCategories: ComplaintCategory[];
  lifeThreatMultiplier: number; // default 1.4
}

export const DEFAULT_WEIGHTS: PriorityWeights = {
  severityWeight: 15,
  citizenWeight: 14,
  agingRatePerDay: 5,
  schoolDistanceThreshold: 300,
  hospitalDistanceThreshold: 500,
  transitDistanceThreshold: 250,
  lifeThreatCategories: ['live_wire_hazard', 'open_manhole', 'fallen_tree', 'sewage_overflow'],
  lifeThreatMultiplier: 1.4,
};

/**
 * Computes an explainable, game-resistant priority score (0 - 100+).
 */
export function calculatePriorityScore(
  baseSeverity: number, // 1 to 5
  affectedCitizenCount: number, // 1, 2, 5, 40...
  daysPending: number, // 0, 1, 2...
  category: ComplaintCategory,
  nearbyLandmarks: LandmarkPOI[] = [],
  customWeights: PriorityWeights = DEFAULT_WEIGHTS
): PriorityBreakdown {
  const w = customWeights;

  // 1. Severity Score: [15, 30, 45, 60, 75]
  const clampedSeverity = Math.min(Math.max(baseSeverity, 1), 5);
  const severityScore = clampedSeverity * w.severityWeight;

  // 2. Citizen Multiplier: Logarithmic scaling to prevent bot spam while respecting organic volume
  // ln(1) = 0, ln(2) = 0.69, ln(5) = 1.61, ln(10) = 2.30, ln(40) = 3.68
  const safeCitizens = Math.max(affectedCitizenCount, 1);
  const citizenMultiplier = Math.round(Math.log(safeCitizens + 1) * w.citizenWeight * 10) / 10;

  // 3. Aging Score (days pending without resolution)
  const safeDays = Math.max(daysPending, 0);
  const agingScore = Math.min(safeDays * w.agingRatePerDay, 40); // capped at 40 pts

  // 4. Proximity Boost (Schools, Hospitals, Metro)
  let proximityBoost = 0;
  const boostReasons: string[] = [];

  for (const poi of nearbyLandmarks) {
    if (poi.type === 'hospital' && poi.distanceMeters <= w.hospitalDistanceThreshold) {
      proximityBoost += 25;
      boostReasons.push(`Hospital within ${poi.distanceMeters}m (+25)`);
    } else if (poi.type === 'school' && poi.distanceMeters <= w.schoolDistanceThreshold) {
      proximityBoost += 18;
      boostReasons.push(`School within ${poi.distanceMeters}m (+18)`);
    } else if (poi.type === 'metro' && poi.distanceMeters <= w.transitDistanceThreshold) {
      proximityBoost += 10;
      boostReasons.push(`Metro/Transit hub within ${poi.distanceMeters}m (+10)`);
    }
  }

  // Cap proximity boost at 35 to maintain balance
  proximityBoost = Math.min(proximityBoost, 35);

  // 5. Life Threat / Hazard Multiplier
  const isLifeThreat = w.lifeThreatCategories.includes(category);
  const lifeThreatMultiplier = isLifeThreat ? w.lifeThreatMultiplier : 1.0;

  // Base sum
  const rawSum = severityScore + citizenMultiplier + agingScore + proximityBoost;
  const totalScore = Math.round(rawSum * lifeThreatMultiplier);

  const formulaString = `[ (Severity ${clampedSeverity} × ${w.severityWeight}) + (ln(${safeCitizens}+1) × ${w.citizenWeight} = ${citizenMultiplier}) + (Days ${safeDays} × ${w.agingRatePerDay}) + Proximity (+${proximityBoost}) ] × Multiplier (${lifeThreatMultiplier}x)`;

  const explanation = isLifeThreat
    ? `Critical life safety threat (${category.replace(/_/g, ' ')}) triggers ${lifeThreatMultiplier}x multiplier with ${proximityBoost > 0 ? boostReasons.join(', ') : 'no sensitive zones'}.`
    : `Standard municipal issue with ${safeCitizens} affected citizen(s), pending ${safeDays} days, proximity boost: +${proximityBoost}.`;

  return {
    severityScore,
    citizenMultiplier,
    agingScore,
    proximityBoost,
    lifeThreatMultiplier,
    totalScore,
    formulaString,
    explanation,
  };
}

/**
 * Returns a human-friendly worked example comparing a Live-Wire hazard vs Pothole.
 */
export function getWorkedExample(): {
  title: string;
  caseA: { name: string; params: string; score: number; math: string; why: string };
  caseB: { name: string; params: string; score: number; math: string; why: string };
  insight: string;
} {
  const caseA = {
    name: 'Incident A: Live Wire Hanging (2 Complaints)',
    params: 'Severity 5, 2 Citizens, 0 Days, 80m from Kendriya Vidyalaya School, Life-Threat',
    score: 160,
    math: '[ (5 × 15 = 75) + (ln(3) × 14 = 15.4) + (0 × 5 = 0) + 18 (School) ] × 1.4 = 152.1 ≈ 152',
    why: 'Direct electrocution risk to schoolchildren triggers instant emergency escalation despite only 2 citizen calls.',
  };

  const caseB = {
    name: 'Incident B: Major Pothole (40 Complaints)',
    params: 'Severity 3, 40 Citizens, 2 Days, No immediate school/hospital, Standard Road',
    score: 111,
    math: '[ (3 × 15 = 45) + (ln(41) × 14 = 52.0) + (2 × 5 = 10) + 0 ] × 1.0 = 107.0 ≈ 107',
    why: 'High public inconvenience with 40 callers, but lower immediate fatality risk than exposed 440V wire.',
  };

  return {
    title: 'Worked Example: Explainable Priority in Action',
    caseA,
    caseB,
    insight:
      'NagarAI prevents the "loudest wheel" bias. While Incident B has 20x more complaints, Incident A is mathematically ranked #1 on the officer queue due to child safety and high-voltage hazard multiplier.',
  };
}
