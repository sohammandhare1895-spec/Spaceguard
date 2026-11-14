export type Route = 'dashboard' | 'vision' | 'permissions';

export type CameraFacing = 'environment' | 'user';

export type CameraStatus =
  | 'idle'
  | 'requesting'
  | 'active'
  | 'denied'
  | 'unavailable'
  | 'error';

export interface Vitals {
  heartRate: number;        // bpm  (simulated)
  spo2: number;             // %    (simulated)
  respiratoryRate: number;  // rpm  (simulated)
  bodyTemp: number;         // °C   (simulated)
  suitPressure: number;     // kPa  (simulated)
  cabinTemp: number;        // °C   (simulated)
  oxygen: number;           // %    (simulated)
  co2: number;              // %    (simulated)
  radiation: number;        // µSv/h (simulated)
}

export interface Astronaut {
  name: string;
  missionId: string;
  suitId: string;
  missionName: string;
}

export type RiskLevel = 'nominal' | 'elevated' | 'warning' | 'critical';

export interface RiskAlert {
  id: string;
  system: BodySystem;
  level: RiskLevel;
  title: string;
  detail: string;
  recommendation: string;
  timestamp: number;
}

export type BodySystem =
  | 'cardiovascular'
  | 'respiratory'
  | 'immune'
  | 'musculoskeletal'
  | 'neurological';

export interface HealthScanResult {
  overall: RiskLevel;
  score: number; // 0-100
  systems: Record<BodySystem, { level: RiskLevel; note: string }>;
  alerts: RiskAlert[];
  recommendations: string[];
  generatedAt: number;
}

export type AppMode = 'dashboard' | 'vision' | 'permissions';

export interface AppStateData {
  mode: AppMode;
  cameraStatus: CameraStatus;
  cameraFacing: CameraFacing;
  soundEnabled: boolean;
  hudBrightness: number; // 0.4 – 1.2
  emergencyActive: boolean;
  alertCount: number;
}

export interface CopilotMessage {
  role: 'user' | 'copilot';
  text: string;
  timestamp: number;
}
