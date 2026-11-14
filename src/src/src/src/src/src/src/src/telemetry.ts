import type { Vitals } from './types';
import { clamp, randomBetween, roundTo } from './utils';

/**
 * Baseline values for a nominal astronaut (simulated demo data).
 * These are used to generate and compare telemetry.
 */
export const NOMINAL_BASELINE: Vitals = {
  heartRate: 68,
  spo2: 98,
  respiratoryRate: 15,
  bodyTemp: 36.7,
  suitPressure: 29.6,
  cabinTemp: 22.5,
  oxygen: 20.9,
  co2: 0.04,
  radiation: 0.35,
};

/**
 * Generate a set of live-ish vitals by drifting slightly around the baseline.
 * Uses a deterministic-ish random walk to feel organic but bounded.
 */
export class TelemetryGenerator {
  private current: Vitals;

  constructor(baseline: Vitals = NOMINAL_BASELINE) {
    this.current = { ...baseline };
  }

  /** Advance one tick and return the updated vitals. */
  tick(): Vitals {
    const c = this.current;
    this.current = {
      heartRate: clamp(c.heartRate + randomBetween(-2, 2), 55, 110),
      spo2: clamp(c.spo2 + randomBetween(-0.3, 0.3), 92, 100),
      respiratoryRate: clamp(c.respiratoryRate + randomBetween(-0.5, 0.5), 10, 26),
      bodyTemp: clamp(c.bodyTemp + randomBetween(-0.1, 0.1), 36.0, 38.5),
      suitPressure: clamp(c.suitPressure + randomBetween(-0.1, 0.1), 28.5, 30.5),
      cabinTemp: clamp(c.cabinTemp + randomBetween(-0.2, 0.2), 20, 26),
      oxygen: clamp(c.oxygen + randomBetween(-0.1, 0.1), 19.5, 21.0),
      co2: clamp(c.co2 + randomBetween(-0.005, 0.005), 0.01, 0.5),
      radiation: clamp(c.radiation + randomBetween(-0.02, 0.02), 0.1, 2.0),
    };
    return this.get();
  }

  get(): Vitals {
    return { ...this.current };
  }

  reset(baseline: Vitals = NOMINAL_BASELINE): void {
    this.current = { ...baseline };
  }
}

export function formatVitals(v: Vitals): Record<string, string> {
  return {
    heartRate: `${roundTo(v.heartRate, 0)} bpm`,
    spo2: `${roundTo(v.spo2, 1)} %`,
    respiratoryRate: `${roundTo(v.respiratoryRate, 0)} /min`,
    bodyTemp: `${roundTo(v.bodyTemp, 1)} °C`,
    suitPressure: `${roundTo(v.suitPressure, 1)} kPa`,
    cabinTemp: `${roundTo(v.cabinTemp, 1)} °C`,
    oxygen: `${roundTo(v.oxygen, 1)} %`,
    co2: `${roundTo(v.co2 * 100, 2)} %`,
    radiation: `${roundTo(v.radiation, 2)} µSv/h`,
  };
}

/**
 * Returns a status classification for a metric compared to a nominal range.
 */
export function classifyMetric(
  key: keyof Vitals,
  value: number,
  baseline: Vitals = NOMINAL_BASELINE
): 'nominal' | 'elevated' | 'warning' | 'critical' {
  const b = baseline[key];
  const deviation = Math.abs(value - b);
  const rel = b !== 0 ? deviation / Math.abs(b) : 0;

  // Thresholds per metric (relative deviation)
  const thresholds: Record<keyof Vitals, [number, number, number]> = {
    heartRate: [0.15, 0.3, 0.5],
    spo2: [0.02, 0.04, 0.06],
    respiratoryRate: [0.15, 0.3, 0.5],
    bodyTemp: [0.02, 0.04, 0.06],
    suitPressure: [0.02, 0.04, 0.06],
    cabinTemp: [0.1, 0.2, 0.3],
    oxygen: [0.03, 0.06, 0.1],
    co2: [0.5, 1.0, 2.0],
    radiation: [1.0, 2.0, 4.0],
  };

  const [t1, t2, t3] = thresholds[key];
  if (rel < t1) return 'nominal';
  if (rel < t2) return 'elevated';
  if (rel < t3) return 'warning';
  return 'critical';
}
