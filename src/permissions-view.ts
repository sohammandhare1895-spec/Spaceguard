import { describeCameraError, isCameraSupported, isSecureContext } from './camera';
import { appState } from './state';

/**
 * Fallback view shown when camera permission is denied or unavailable.
 * Provides clear instructions to re-enable camera access, and a demo-mode entry.
 */
export class PermissionsView {
  private root: HTMLElement;
  private onRetry: () => void;

  constructor(root: HTMLElement, onRetry: () => void) {
    this.root = root;
    this.onRetry = onRetry;
  }

  mount(): void {
    appState.setMode('permissions');
    const supported = isCameraSupported();
    const secure = isSecureContext();

    const supportedLine = supported
      ? 'Your browser supports camera access.'
      : 'Your browser does not support camera access (MediaDevices API missing).';
    const secureLine = secure
      ? 'Secure context detected — camera access is allowed.'
      : '⚠ This page is not in a secure context. Camera access requires HTTPS (or localhost).';

    this.root.innerHTML = `
      <div class="permissions">
        <h2>Camera Permission Required</h2>
        <p>ASTRA needs camera access to create the immersive astronaut helmet HUD.
        Camera frames stay on your device and are never uploaded.</p>
        <div class="error-detail">${supportedLine}<br/>${secureLine}</div>
        <p style="font-size:0.8rem;color:var(--astra-dim)">${describeCameraError(new Error('PERMISSION_DENIED'))}</p>
        <div style="font-size:0.8rem;line-height:1.8;color:var(--astra-text);text-align:left;max-width:540px;margin-bottom:1.5rem;">
          <strong style="color:var(--astra-cyan)">To enable camera access:</strong>
          <ol style="padding-left:1.2rem;margin-top:0.5rem;">
            <li>Tap the lock/settings icon in your browser's address bar.</li>
            <li>Find "Camera" and set it to <strong>Allow</strong>.</li>
            <li>Reload the page or tap "Retry Camera" below.</li>
            <li>Ensure you are on <strong>HTTPS</strong> (or localhost).</li>
          </ol>
        </div>
        <div class="permissions-actions">
          <button class="btn btn-primary" id="retry">Retry Camera</button>
          <button class="btn" id="demo">Continue in Demo Mode</button>
          <button class="btn" id="back">Back to Dashboard</button>
        </div>
      </div>
    `;

    (this.root.querySelector('#retry') as HTMLButtonElement | null)?.addEventListener('click', () => {
      this.onRetry();
    });
    (this.root.querySelector('#demo') as HTMLButtonElement | null)?.addEventListener('click', () => {
      // Navigate to vision — VisionView will detect no camera and use demo bg
      window.location.hash = '#vision';
    });
    (this.root.querySelector('#back') as HTMLButtonElement | null)?.addEventListener('click', () => {
      window.location.hash = '#dashboard';
    });
  }
}
