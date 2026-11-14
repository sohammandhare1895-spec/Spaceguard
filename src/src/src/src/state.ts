import type { AppStateData, AppMode, CameraFacing, CameraStatus } from './types';

type Listener = (state: AppStateData) => void;

class AppState {
  private data: AppStateData = {
    mode: 'dashboard',
    cameraStatus: 'idle',
    cameraFacing: 'environment',
    soundEnabled: true,
    hudBrightness: 1,
    emergencyActive: false,
    alertCount: 0,
  };

  private listeners = new Set<Listener>();

  get(): AppStateData {
    return this.data;
  }

  set(partial: Partial<AppStateData>): void {
    this.data = { ...this.data, ...partial };
    this.listeners.forEach((l) => {
      try { l(this.data); } catch { /* ignore listener errors */ }
    });
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.data);
    return () => this.listeners.delete(listener);
  }

  setMode(mode: AppMode): void {
    this.set({ mode });
  }

  setCameraStatus(status: CameraStatus): void {
    this.set({ cameraStatus: status });
  }

  setCameraFacing(facing: CameraFacing): void {
    this.set({ cameraFacing: facing });
  }

  toggleSound(): boolean {
    const next = !this.data.soundEnabled;
    this.set({ soundEnabled: next });
    return next;
  }

  setBrightness(value: number): void {
    const clamped = Math.max(0.4, Math.min(1.2, value));
    this.set({ hudBrightness: clamped });
  }

  setEmergency(active: boolean): void {
    this.set({ emergencyActive: active });
  }

  setAlertCount(count: number): void {
    this.set({ alertCount: count });
  }
}

export const appState = new AppState();
