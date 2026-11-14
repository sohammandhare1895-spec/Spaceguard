import type { CameraFacing, CameraStatus } from './types';

export interface CameraController {
  start(facing: CameraFacing): Promise<MediaStream>;
  stop(): void;
  switchFacing(): Promise<MediaStream>;
  getStream(): MediaStream | null;
  getFacing(): CameraFacing;
}

let currentStream: MediaStream | null = null;
let currentFacing: CameraFacing = 'environment';

/**
 * Request camera access using the native MediaDevices API.
 * Throws a descriptive Error on failure.
 */
export async function requestCamera(facing: CameraFacing): Promise<MediaStream> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('CAMERA_UNSUPPORTED');
  }

  // Stop any existing tracks first
  stopAllTracks();

  const constraints: MediaStreamConstraints = {
    audio: false,
    video: {
      facingMode: { ideal: facing },
      width: { ideal: 1920 },
      height: { ideal: 1080 },
    },
  };

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia(constraints);
  } catch (err) {
    const e = err as DOMException;
    if (e.name === 'NotAllowedError' || e.name === 'SecurityError') {
      throw new Error('PERMISSION_DENIED');
    }
    if (e.name === 'NotFoundError' || e.name === 'OverconstrainedError') {
      throw new Error('NO_CAMERA');
    }
    if (e.name === 'NotReadableError') {
      throw new Error('CAMERA_BUSY');
    }
    throw new Error(`CAMERA_ERROR:${e.name}`);
  }

  currentStream = stream;
  currentFacing = facing;
  return stream;
}

export function stopAllTracks(): void {
  if (currentStream) {
    currentStream.getTracks().forEach((track) => {
      try { track.stop(); } catch { /* ignore */ }
    });
    currentStream = null;
  }
}

export function getStream(): MediaStream | null {
  return currentStream;
}

export function getFacing(): CameraFacing {
  return currentFacing;
}

export function mapErrorToStatus(err: unknown): CameraStatus {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('PERMISSION_DENIED')) return 'denied';
  if (msg.includes('NO_CAMERA')) return 'unavailable';
  if (msg.includes('CAMERA_UNSUPPORTED')) return 'unavailable';
  return 'error';
}

export function describeCameraError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  switch (msg) {
    case 'PERMISSION_DENIED':
      return 'Camera permission was denied. Please allow camera access in your browser settings and try again.';
    case 'NO_CAMERA':
      return 'No camera was found on this device. ASTRA will run in demo mode.';
    case 'CAMERA_BUSY':
      return 'The camera is currently in use by another application. Please close it and try again.';
    case 'CAMERA_UNSUPPORTED':
      return 'Your browser does not support camera access. Please use a modern browser (Chrome, Edge, or Safari) over HTTPS.';
    default:
      return `Camera error: ${msg}`;
  }
}

/**
 * Check if the browser supports camera access.
 */
export function isCameraSupported(): boolean {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

/**
 * Check if we're in a secure context (required for camera).
 */
export function isSecureContext(): boolean {
  return window.isSecureContext || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
}

/**
 * Attach a stream to a video element and play it.
 */
export async function attachStreamToVideo(video: HTMLVideoElement, stream: MediaStream): Promise<void> {
  video.srcObject = stream;
  video.setAttribute('playsinline', 'true');
  video.setAttribute('muted', 'true');
  video.muted = true;
  try {
    await video.play();
  } catch {
    // Autoplay may be blocked; user gesture from ENTER button usually allows it.
    // Try again on next interaction.
    const resume = () => { video.play().catch(() => {}); };
    document.addEventListener('click', resume, { once: true });
    document.addEventListener('touchstart', resume, { once: true });
  }
}
