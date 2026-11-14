import type { RiskLevel, Vitals } from './types';
import { NOMINAL_BASELINE } from './telemetry';

/**
 * Future Health Simulator — explore hypothetical scenarios over 7 days.
 * All results are simulated demo data.
 */

export interface SimulationInput {
  sleepHours: number;      // 4–10
  exerciseMinutes: number;  // 0–120
  hydrationPct: number;     // 50–100
  stressLevel: number;      // 1–10
  radiationExposure: number; // 0–5 (relative multiplier)
}

export interface SimulationDay {
  day: number;
  vitals: Vitals;
  riskLevel: RiskLevel;
  note: string;
}

export interface SimulationResult {
  days: SimulationDay[];
  overallTrend: 'improving' | 'stable' | 'declining';
  summary: string;
}

export const DEFAULT_SIM_INPUT: SimulationInput = {
  sleepHours: 7.5,
  exerciseMinutes: 45,
  hydrationPct: 85,
  stressLevel: 4,
  radiationExposure: 1,
};

export function runSimulation(input: SimulationInput): SimulationResult {
  const days: SimulationDay[] = [];
  const base = NOMINAL_BASELINE;
  let current = { ...base };

  for (let d = 1; d <= 7; d++) {
    // Sleep effect
    const sleepDeficit = Math.max(0, 8 - input.sleepHours);
    // Exercise effect
    const exerciseBenefit = Math.min(1, input.exerciseMinutes / 60);
    // Hydration effect
    const hydrationDeficit = Math.max(0, 90 - input.hydrationPct) / 40;
    // Stress effect
    const stressNorm = input.stressLevel / 10;
    // Radiation effect
    const radNorm = input.radiationExposure / 5;

    const hr = base.heartRate + sleepDeficit * 3 + stressNorm * 15 - exerciseBenefit * 3;
    const spo2 = base.spo2 - hydrationDeficit * 2 - radNorm * 1.5;
    const rr = base.respiratoryRate + sleepDeficit * 1.2 + stressNorm * 3;
    const temp = base.bodyTemp + (radNorm * 0.4) + (sleepDeficit * 0.1);
    const suitPressure = base.suitPressure;
    const cabinTemp = base.cabinTemp + radNorm * 1.5;
    const oxygen = base.oxygen - hydrationDeficit * 0.4;
    const co2 = base.co2 + sleepDeficit * 0.03 + stressNorm * 0.05;
    const radiation = base.radiation + radNorm * 1.2 + d * 0.02;

    current = {
      heartRate: clamp(hr, 50, 140),
      spo2: clamp(spo2, 88, 100),
      respiratoryRate: clamp(rr, 10, 32),
      bodyTemp: clamp(temp, 36.0, 39.5),
      suitPressure,
      cabinTemp: clamp(cabinTemp, 18, 32),
      oxygen: clamp(oxygen, 18, 21),
      co2: clamp(co2, 0.01, 1.0),
      radiation: clamp(radiation, 0.1, 6),
    };

    const level = classifyDay(current, base, sleepDeficit, stressNorm, radNorm);
    days.push({
      day: d,
      vitals: { ...current },
      riskLevel: level,
      note: dayNote(level, input),
    });
  }

  const levels = days.map((d) => d.riskLevel);
  const trend = computeTrend(levels);
  const summary = buildSummary(trend, input);

  return { days, overallTrend: trend, summary };
}

function classifyDay(v: Vitals, base: Vitals, sleepDef: number, stress: number, rad: number): RiskLevel {
  const hrDev = Math.abs(v.heartRate - base.heartRate) / base.heartRate;
  const spo2Dev = Math.abs(v.spo2 - base.spo2) / base.spo2;
  const rrDev = Math.abs(v.respiratoryRate - base.respiratoryRate) / base.respiratoryRate;
  const tempDev = Math.abs(v.bodyTemp - base.bodyTemp) / base.bodyTemp;
  const co2Dev = Math.abs(v.co2 - base.co2) / Math.max(base.co2, 0.01);

  const maxDev = Math.max(hrDev, spo2Dev, rrDev, tempDev, co2Dev, rad * 0.3);

  if (maxDev > 0.45) return 'critical';
  if (maxDev > 0.25) return 'warning';
  if (maxDev > 0.12 || sleepDef > 1.5 || stress > 0.6) return 'elevated';
  return 'nominal';
}

function dayNote(level: RiskLevel, input: SimulationInput): string {
  if (level === 'nominal') return 'Nominal range. Continue current protocol.';
  if (level === 'elevated') {
    if (input.sleepHours < 6) return 'Sleep deficit detected. Prioritise rest.';
    if (input.stressLevel > 6) return 'Elevated stress. Schedule relaxation period.';
    return 'Minor deviation. Monitor closely.';
  }
  if (level === 'warning') {
    if (input.hydrationPct < 70) return 'Hydration low. Increase fluid intake.';
    if (input.radiationExposure > 3) return 'Radiation exposure elevated. Reduce EVA time.';
    return 'Warning range. Consult flight surgeon.';
  }
  return 'Critical range. Initiate countermeasures immediately.';
}

function computeTrend(levels: RiskLevel[]): 'improving' | 'stable' | 'declining' {
  const rank = { nominal: 0, elevated: 1, warning: 2, critical: 3 } as const;
  const first = rank[levels[0]];
  const last = rank[levels[levels.length - 1]];
  if (last < first) return 'improving';
  if (last > first) return 'declining';
  return 'stable';
}

function buildSummary(trend: string, input: SimulationInput): string {
  const parts: string[] = [];
  if (input.sleepHours < 7) parts.push('increasing sleep');
  if (input.hydrationPct < 80) parts.push('improving hydration');
  if (input.exerciseMinutes < 30) parts.push('adding exercise');
  if (input.stressLevel > 6) parts.push('stress management');
  if (input.radiationExposure > 3) parts.push('limiting EVA radiation exposure');

  const advice = parts.length ? `Recommended: ${parts.join(', ')}.` : 'Continue current protocol.';
  return `7-day projection trend: ${trend.toUpperCase()}. ${advice}`;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}
