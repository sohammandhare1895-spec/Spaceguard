import { safeSetJSON, safeGetJSON } from './storage';
import { escapeHtml } from './utils';
import { appState } from './state';

export class DashboardView {
  private root: HTMLElement;
  private onEnter: () => void;

  constructor(root: HTMLElement, onEnter: () => void) {
    this.root = root;
    this.onEnter = onEnter;
  }

  mount(): void {
    appState.setMode('dashboard');
    const lastVisit = safeGetJSON<string>('astra-last-visit', '');
    const visitLine = lastVisit
      ? `Last session: ${escapeHtml(lastVisit)}`
      : 'First session — welcome aboard.';

    this.root.innerHTML = `
      <div class="dashboard">
        <div class="dashboard-logo">ASTRA</div>
        <div class="dashboard-sub">Astronaut Health Intelligence System</div>
        <div class="dashboard-mission">MISSION ASTRA-MARS-07 · ${visitLine}</div>
        <button class="enter-vision-btn" id="enter-vision" aria-label="Enter Astronaut Vision — opens live camera HUD">
          ENTER ASTRONAUT VISION
        </button>
        <div class="dashboard-disclaimer">
          <strong style="color:var(--astra-cyan)">IMPORTANT:</strong>
          ASTRA uses your device camera to create an immersive first-person helmet HUD.
          Camera frames are processed <strong>entirely on your device</strong> and are never uploaded.
          All health readings shown inside the vision are
          <strong>SIMULATED DEMO DATA</strong> — a browser camera cannot measure SpO₂,
          blood pressure, radiation, bone density or immune function.
          Real health monitoring integrations are designed as future hardware/API additions.
          This is not a medical device and does not provide diagnoses.
        </div>
        <div class="dashboard-disclaimer" style="border-top:none;padding-top:0;margin-top:0.8rem;font-size:0.62rem;">
          Camera access requires HTTPS or localhost. Works on Android &amp; iOS in modern
          Chrome, Edge and Safari. Camera is stopped when you exit.
        </div>
      </div>
    `;

    const btn = this.root.querySelector('#enter-vision') as HTMLButtonElement | null;
    btn?.addEventListener('click', () => this.handleEnter());
    // Save visit
    safeSetJSON('astra-last-visit', new Date().toUTCString());
  }

  private handleEnter(): void {
    // If camera not supported or insecure context, still allow entering (demo mode)
    // VisionView handles the fallback.
    this.onEnter();
  }
}
