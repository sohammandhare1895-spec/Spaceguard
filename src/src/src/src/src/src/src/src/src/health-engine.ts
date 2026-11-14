import type { BodySystem, HealthScanResult, RiskLevel, Vitals, RiskAlert } from './types';
import { NOMINAL_BASELINE, classifyMetric } from './telemetry';
import { uid } from './utils';

const SYSTEMS: BodySystem[] = [
  'cardiovascular',
  'respiratory',
  'immune',
  'musculoskeletal',
  'neurological',
];

const SYSTEM_NOTES: Record<BodySystem, Record<RiskLevel, string>> = {
  cardiovascular: {
    nominal: 'Heart rate and rhythm within nominal parameters.',
    elevated: 'Slight HR elevation detected. Monitor for stress response.',
    warning: 'Elevated cardiovascular strain. Recommend rest and hydration.',
    critical: 'Significant cardiovascular anomaly. Initiate immediate review.',
  },
  respiratory: {
    nominal: 'Respiration and SpO2 within nominal parameters.',
    elevated: 'Minor respiratory elevation. Continue observation.',
    warning: 'Respiratory indicators outside nominal range. Check cabin O2/CO2.',
    critical: 'Respiratory distress indicators present. Initiate emergency protocol.',
  },
  immune: {
    nominal: 'No signs of immune stress detected.',
    elevated: 'Mild immune stress indicators. Monitor for inflammation markers.',
    warning: 'Elevated immune response pattern. Consider countermeasures.',
    critical: 'Severe immune stress pattern. Consult flight surgeon.',
  },
  musculoskeletal: {
    nominal: 'Musculoskeletal load within nominal parameters.',
    elevated: 'Slight musculoskeletal load. Continue exercise protocol.',
    warning: 'Elevated bone/muscle stress. Increase resistance training.',
    critical: 'Severe musculoskeletal stress. Notify flight surgeon immediately.',
  },
  neurological: {
    nominal: 'Cognitive and neurological indicators nominal.',
    elevated: 'Mild cognitive fatigue indicators. Monitor sleep quality.',
    warning: 'Neurological strain detected. Schedule rest period.',
    critical: 'Significant neurological anomaly. Initiate immediate review.',
  },
};

const RECOMMENDATIONS: Record<RiskLevel, string[]> = {
  nominal: [
    'Continue nominal operations.',
    'Maintain hydration and exercise schedule.',
    'Next scheduled health scan in 6 hours.',
  ],
  elevated: [
    'Increase fluid intake.',
    'Schedule a 10-minute rest period.',
    'Re-check vitals in 30 minutes.',
  ],
  warning: [
    'Reduce physical activity temporarily.',
    'Review cabin environmental telemetry.',
    'Notify flight surgeon at next comm window.',
  ],
  critical: [
    'Initiate emergency medical protocol.',
    'Contact flight surgeon immediately.',
    'Prepare for potential medical intervention.',
  ],
};

/**
 * Build a risk alert from a vitals comparison.
 */
function buildAlert(system: BodySystem, level: RiskLevel, vitals: Vitals): RiskAlert | null {
  if (level === 'nominal') return null;

  const titles: Record<BodySystem, string> = {
    cardiovascular: 'Cardiovascular variance',
    respiratory: 'Respiratory variance',
    immune: 'Immune stress indicator',
    musculoskeletal: 'Musculoskeletal stress',
    neurological: 'Neurological indicator',
  };

  const details: Record<BodySystem, string> = {
    cardiovascular: `HR ${Math.round(vitals.heartRate)} bpm`,
    respiratory: `RR ${Math.round(vitals.respiratoryRate)}/min, SpO2 ${vitals.spo2.toFixed(1)}%`,
    immune: `Body temp ${vitals.bodyTemp.toFixed(1)}°C`,
    musculoskeletal: `Suit pressure ${vitals.suitPressure.toFixed(1)} kPa`,
    neurological: `Cabin temp ${vitals.cabinTemp.toFixed(1)}°C`,
  };

  return {
    id: uid(),
    system,
    level,
    title: titles[system],
    detail: details[system],
    recommendation: RECOMMENDATIONS[level][0],
    timestamp: Date.now(),
  };
}

/**
 * Analyze vitals and produce a full health scan result.
 * All data is simulated demo data — clearly labelled in the UI.
 */
export function analyzeVitals(vitals: Vitals): HealthScanResult {
  const alerts: RiskAlert[] = [];
  const systemLevels: Record<BodySystem, { level: RiskLevel; note: string }> = {} as any;

  // Cardiovascular: heart rate
  const hrLevel = classifyMetric('heartRate', vitals.heartRate, NOMINAL_BASELINE);
  systemLevels.cardiovascular = { level: hrLevel, note: SYSTEM_NOTES.cardiovascular[hrLevel] };
  const hrAlert = buildAlert('cardiovascular', hrLevel, vitals);
  if (hrAlert) alerts.push(hrAlert);

  // Respiratory: RR + SpO2
  const rrLevel = classifyMetric('respiratoryRate', vitals.respiratoryRate, NOMINAL_BASELINE);
  const spo2Level = classifyMetric('spo2', vitals.spo2, NOMINAL_BASELINE);
  const respLevel = worstLevel(rrLevel, spo2Level);
  systemLevels.respiratory = { level: respLevel, note: SYSTEM_NOTES.respiratory[respLevel] };
  const respAlert = buildAlert('respiratory', respLevel, vitals);
  if (respAlert) alerts.push(respAlert);

  // Immune: body temp
  const tempLevel = classifyMetric('bodyTemp', vitals.bodyTemp, NOMINAL_BASELINE);
  systemLevels.immune = { level: tempLevel, note: SYSTEM_NOTES.immune[tempLevel] };
  const immuneAlert = buildAlert('immune', tempLevel, vitals);
  if (immuneAlert) alerts.push(immuneAlert);

  // Musculoskeletal: suit pressure (proxy)
  const suitLevel = classifyMetric('suitPressure', vitals.suitPressure, NOMINAL_BASELINE);
  systemLevels.musculoskeletal = { level: suitLevel, note: SYSTEM_NOTES.musculoskeletal[suitLevel] };
  const msAlert = buildAlert('musculoskeletal', suitLevel, vitals);
  if (msAlert) alerts.push(msAlert);

  // Neurological: cabin temp + CO2 (proxy)
  const cabinLevel = classifyMetric('cabinTemp', vitals.cabinTemp, NOMINAL_BASELINE);
  const co2Level = classifyMetric('co2', vitals.co2, NOMINAL_BASELINE);
  const neuroLevel = worstLevel(cabinLevel, co2Level);
  systemLevels.neurological = { level: neuroLevel, note: SYSTEM_NOTES.neurological[neuroLevel] };
  const neuroAlert = buildAlert('neurological', neuroLevel, vitals);
  if (neuroAlert) alerts.push(neuroAlert);

  const overall = worstLevel(...(SYSTEMS.map((s) => systemLevels[s].level)));
  const score = computeScore(systemLevels);

  return {
    overall,
    score,
    systems: systemLevels,
    alerts,
    recommendations: RECOMMENDATIONS[overall],
    generatedAt: Date.now(),
  };
}

const LEVEL_RANK: Record<RiskLevel, number> = {
  nominal: 0,
  elevated: 1,
  warning: 2,
  critical: 3,
};

export function worstLevel(...levels: RiskLevel[]): RiskLevel {
  return levels.reduce((acc, l) => (LEVEL_RANK[l] > LEVEL_RANK[acc] ? l : acc), 'nominal' as RiskLevel);
}

function computeScore(systems: Record<BodySystem, { level: RiskLevel }>): number {
  const values = SYSTEMS.map((s) => LEVEL_RANK[systems[s].level]);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  // avg 0 => 100, avg 3 => 40
  return Math.round(100 - avg * 20);
}

export const BODY_SYSTEMS = SYSTEMS;
