import './styles.css';
import { App } from './app';

const root = document.getElementById('app-root');
if (!root) {
  throw new Error('Root element #app-root not found');
}

const app = new App(root);
app.start();

// Expose for debugging in dev only
if (import.meta.env && import.meta.env.DEV) {
  (window as any).__ASTRA__ = app;
}
