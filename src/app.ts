import { Router } from './router';
import { appState } from './state';
import { DashboardView } from './dashboard-view';
import { VisionView } from './vision-view';
import { PermissionsView } from './permissions-view';
import { setupAccessibility } from './accessibility';
import { stopAllTracks } from './camera';
import type { Route } from './types';

export class App {
  private router: Router;
  private root: HTMLElement;
  private currentView: { destroy?: () => void } | null = null;

  constructor(root: HTMLElement) {
    this.root = root;
    this.router = new Router();

    // Register routes
    this.router.register('dashboard', async () => {
      const view = new DashboardView(this.root, () => this.router.navigate('vision'));
      this.currentView = view;
      view.mount();
    });

    this.router.register('vision', async () => {
      const view = new VisionView(this.root, () => this.router.navigate('dashboard'));
      this.currentView = view;
      view.mount();
    });

    this.router.register('permissions', async () => {
      const view = new PermissionsView(this.root, () => this.router.navigate('vision'));
      this.currentView = view;
      view.mount();
    });

    // Handle browser back / hash change
    window.addEventListener('hashchange', () => this.handleRoute());
  }

  start(): void {
    setupAccessibility();
    this.handleRoute();
    appState.subscribe(() => {
      // keep body dataset in sync for theme/status
      document.body.dataset.mode = appState.get().mode;
    });
  }

  private async handleRoute(): Promise<void> {
    // Cleanup previous view
    if (this.currentView && this.currentView.destroy) {
      try { this.currentView.destroy(); } catch { /* ignore */ }
    }
    this.currentView = null;

    // Stop camera tracks when leaving vision
    stopAllTracks();

    const route = this.router.getCurrent() as Route;
    const handler = this.router.getHandler(route);
    this.root.innerHTML = '';
    if (handler) {
      await handler();
    } else {
      // default to dashboard
      this.router.navigate('dashboard', true);
    }
  }
}
