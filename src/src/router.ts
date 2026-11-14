import type { Route } from './types';

const ROUTES: Route[] = ['dashboard', 'vision', 'permissions'];

export class Router {
  private handlers = new Map<Route, () => void | Promise<void>>();

  constructor() {
    // initial route from hash
    if (!window.location.hash) {
      window.location.hash = '#dashboard';
    }
  }

  register(route: Route, handler: () => void | Promise<void>): void {
    this.handlers.set(route, handler);
  }

  getHandler(route: Route): (() => void | Promise<void>) | undefined {
    return this.handlers.get(route);
  }

  getCurrent(): Route {
    const hash = window.location.hash.replace('#', '').trim();
    return (ROUTES as string[]).includes(hash) ? (hash as Route) : 'dashboard';
  }

  navigate(route: Route, replace = false): void {
    const target = `#${route}`;
    if (replace) {
      window.location.replace(target);
    } else if (window.location.hash !== target) {
      window.location.hash = target;
    } else {
      // same hash — force a route update
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    }
  }
}
