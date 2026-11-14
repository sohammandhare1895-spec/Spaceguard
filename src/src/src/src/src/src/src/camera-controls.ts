import type { CameraFacing } from './types';
import { requestCamera, stopAllTracks, attachStreamToVideo, getFacing } from './camera';

export interface CameraControlsOptions {
  video: HTMLVideoElement;
  onStatusChange: (status: 'active' | 'off' | 'error', facing: CameraFacing) => void;
  onError: (message: string) => void;
}

export class CameraControls {
  private video: HTMLVideoElement;
  private opts: CameraControlsOptions;
  private active = false;
  private facing: CameraFacing = 'environment';
  private busy = false;

  constructor(opts: CameraControlsOptions) {
    this.video = opts.video;
    this.opts = opts;
  }

  async turnOn(facing?: CameraFacing): Promise<boolean> {
    if (this.busy) return false;
    this.busy = true;
    const targetFacing = facing ?? this.facing;
    try {
      const stream = await requestCamera(targetFacing);
      await attachStreamToVideo(this.video, stream);
      this.active = true;
      this.facing = targetFacing;
      this.opts.onStatusChange('active', this.facing);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.active = false;
      this.opts.onStatusChange('error', this.facing);
      this.opts.onError(msg);
      return false;
    } finally {
      this.busy = false;
    }
  }

  turnOff(): void {
    stopAllTracks();
    this.video.srcObject = null;
    this.active = false;
    this.opts.onStatusChange('off', this.facing);
  }

  async toggle(): Promise<void> {
    if (this.active) {
      this.turnOff();
    } else {
      await this.turnOn();
    }
  }

  async switchFacing(): Promise<void> {
    if (this.busy) return;
    const next: CameraFacing = this.facing === 'environment' ? 'user' : 'environment';
    this.busy = true;
    try {
      const stream = await requestCamera(next);
      await attachStreamToVideo(this.video, stream);
      this.facing = next;
      this.active = true;
      this.opts.onStatusChange('active', this.facing);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.opts.onError(msg);
    } finally {
      this.busy = false;
    }
  }

  isActive(): boolean {
    return this.active;
  }

  getFacingMode(): CameraFacing {
    return this.facing;
  }

  destroy(): void {
    stopAllTracks();
    this.video.srcObject = null;
    this.active = false;
  }
}
