import math
from typing import List, Dict, Any, Optional

LIFE_THREAT_CATEGORIES = {
    'live_wire_hazard',
    'open_manhole',
    'fallen_tree',
    'sewage_overflow',
    'building_collapse',
    'gas_leak'
}

DEFAULT_WEIGHTS = {
    'severityWeight': 15,
    'citizenWeight': 14,
    'agingRatePerDay': 5,
    'schoolDistanceThreshold': 300,
    'hospitalDistanceThreshold': 500,
    'transitDistanceThreshold': 250,
    'lifeThreatMultiplier': 1.4,
}

def calculate_priority_score(
    base_severity: int,
    affected_citizen_count: int,
    days_pending: float,
    category: str,
    nearby_landmarks: Optional[List[Dict[str, Any]]] = None,
    custom_weights: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Computes an explainable, game-resistant priority score (0 - 100+).
    Score = [ (Severity * 15) + (ln(Affected+1) * 14) + (Days * 5) + ProximityBoost ] * LifeThreatMultiplier
    """
    if nearby_landmarks is None:
        nearby_landmarks = []
    w = {**DEFAULT_WEIGHTS, **(custom_weights or {})}

    # 1. Severity Score: [15, 30, 45, 60, 75]
    clamped_severity = min(max(int(base_severity or 3), 1), 5)
    severity_score = clamped_severity * w['severityWeight']

    # 2. Citizen Multiplier: Logarithmic scaling
    safe_citizens = max(int(affected_citizen_count or 1), 1)
    citizen_multiplier = round(math.log(safe_citizens + 1) * w['citizenWeight'], 1)

    # 3. Aging Score
    safe_days = max(float(days_pending or 0.0), 0.0)
    aging_score = min(round(safe_days * w['agingRatePerDay'], 1), 40.0)

    # 4. Proximity Boost (Schools, Hospitals, Metro)
    proximity_boost = 0
    boost_reasons = []

    for poi in nearby_landmarks:
        p_type = poi.get('type')
        p_dist = poi.get('distanceMeters', 99999)
        if p_type == 'hospital' and p_dist <= w['hospitalDistanceThreshold']:
            proximity_boost += 25
            boost_reasons.append(f"Hospital within {p_dist}m (+25)")
        elif p_type == 'school' and p_dist <= w['schoolDistanceThreshold']:
            proximity_boost += 18
            boost_reasons.append(f"School within {p_dist}m (+18)")
        elif p_type == 'metro' and p_dist <= w['transitDistanceThreshold']:
            proximity_boost += 10
            boost_reasons.append(f"Metro/Transit hub within {p_dist}m (+10)")

    proximity_boost = min(proximity_boost, 35)

    # 5. Life Threat / Hazard Multiplier
    is_life_threat = category in LIFE_THREAT_CATEGORIES
    life_threat_multiplier = w['lifeThreatMultiplier'] if is_life_threat else 1.0

    raw_sum = severity_score + citizen_multiplier + aging_score + proximity_boost
    total_score = int(round(raw_sum * life_threat_multiplier))

    formula_string = (
        f"[ (Severity {clamped_severity} × {w['severityWeight']}) + "
        f"(ln({safe_citizens}+1) × {w['citizenWeight']} = {citizen_multiplier}) + "
        f"(Days {safe_days} × {w['agingRatePerDay']}) + "
        f"Proximity (+{proximity_boost}) ] × Multiplier ({life_threat_multiplier}x)"
    )

    clean_category = (category or 'issue').replace('_', ' ')
    if is_life_threat:
        reason_str = ', '.join(boost_reasons) if boost_reasons else 'no sensitive zones'
        explanation = f"Critical life safety threat ({clean_category}) triggers {life_threat_multiplier}x multiplier with {reason_str}."
    else:
        explanation = f"Standard municipal issue with {safe_citizens} affected citizen(s), pending {safe_days} days, proximity boost: +{proximity_boost}."

    return {
        'severityScore': severity_score,
        'citizenMultiplier': citizen_multiplier,
        'agingScore': aging_score,
        'proximityBoost': proximity_boost,
        'lifeThreatMultiplier': life_threat_multiplier,
        'totalScore': total_score,
        'formulaString': formula_string,
        'explanation': explanation
    }

def get_worked_example() -> Dict[str, Any]:
    """Returns dynamic explainable priority formula metadata."""
    return {
        "title": "Explainable Priority Formula",
        "formula": "[ (Severity × W_sev) + (ln(Citizens + 1) × W_cit) + (Days × W_age) + Proximity ] × LifeThreatMultiplier",
        "weights": DEFAULT_WEIGHTS
    }
