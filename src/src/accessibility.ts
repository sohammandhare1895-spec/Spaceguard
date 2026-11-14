/**
 * Accessibility helpers — keyboard handling, reduced-motion awareness,
 * focus management and screen-reader announcements.
 */

export function setupAccessibility(): void {
  // Global keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Escape closes any open modal
    if (e.key === 'Escape') {
      const modal = document.querySelector('#hud-modal');
      if (modal) {
        modal.remove();
      }
    }
  });

  // Respect prefers-reduced-motion by adding a body class
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const apply = () => {
    document.body.classList.toggle('reduced-motion', mq.matches);
  };
  apply();
  mq.addEventListener?.('change', apply);
}

/**
 * Announce a message to screen readers via a live region.
 */
export function announce(message: string): void {
  let region = document.querySelector('#astra-live-region') as HTMLElement | null;
  if (!region) {
    region = document.createElement('div');
    region.id = 'astra-live-region';
    region.className = 'sr-only';
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    document.body.appendChild(region);
  }
  region.textContent = message;
}

/**
 * Trap focus inside a container (for modals). Returns a cleanup function.
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusable = container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (!focusable.length) return () => {};

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const previouslyFocused = document.activeElement as HTMLElement | null;

  const handler = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  container.addEventListener('keydown', handler);
  first.focus();

  return () => {
    container.removeEventListener('keydown', handler);
    previouslyFocused?.focus();
  };
}
