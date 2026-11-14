import type { HealthScanResult, RiskAlert, RiskLevel } from './types';

/**
 * Risk engine — combines multiple health indicators into prioritised alerts.
 * All data is simulated demo data; this is decision-support only, not diagnosis.
 */

const LEVEL_RANK: Record<RiskLevel, number> = {
  nominal: 0,
  elevated: 1,
  warning: 2,
  critical: 3,
};

export interface RiskSummary {
  topLevel: RiskLevel;
  sortedAlerts: RiskAlert[];
  total: number;
  byLevel: Record<RiskLevel, number>;
}

export function summarizeRisks(scan: HealthScanResult): RiskSummary {
  const sorted = [...scan.alerts].sort(
    (a, b) => LEVEL_RANK[b.level] - LEVEL_RANK[a.level] || b.timestamp - a.timestamp
  );
  const byLevel: Record<RiskLevel, number> = { nominal: 0, elevated: 0, warning: 0, critical: 0 };
  for (const a of scan.alerts) byLevel[a.level]++;
  return {
    topLevel: scan.overall,
    sortedAlerts: sorted,
    total: scan.alerts.length,
    byLevel,
  };
}

export function levelLabel(level: RiskLevel): string {
  switch (level) {
    case 'nominal': return 'NOMINAL';
    case 'elevated': return 'ELEVATED';
    case 'warning': return 'WARNING';
    case 'critical': return 'CRITICAL';
  }
}

export function levelColor(level: RiskLevel): string {
  switch (level) {
    case 'nominal': return 'var(--astra-green)';
    case 'elevated': return 'var(--astra-amber)';
    case 'warning': return 'var(--astra-amber)';
    case 'critical': return 'var(--astra-red)';
  }
}
