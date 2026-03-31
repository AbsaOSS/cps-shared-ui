import { InjectionToken } from '@angular/core';
import type { RunOptions } from 'axe-core';
import { A11yCategory } from './a11y-issue.model';

export type A11yScanTrigger = 'navigation' | 'mutation' | 'manual';

export interface A11yOverlayConfig {
  /** Whether the overlay is enabled. Defaults to isDevMode(). */
  enabled?: boolean;
  /** When to trigger scans. Defaults to 'navigation'. */
  scanOn?: A11yScanTrigger;
  /** Which scanner categories to enable. Defaults to all. */
  categories?: A11yCategory[];
  /** Debounce time in ms for mutation-triggered scans. Defaults to 1000. */
  debounceMs?: number;
  /** Additional axe-core run options. */
  axeOptions?: RunOptions;
}

export const A11Y_OVERLAY_CONFIG = new InjectionToken<A11yOverlayConfig>(
  'A11Y_OVERLAY_CONFIG'
);

export const DEFAULT_A11Y_CONFIG: Required<
  Pick<A11yOverlayConfig, 'scanOn' | 'categories' | 'debounceMs'>
> = {
  scanOn: 'navigation',
  categories: ['axe', 'focus-order', 'headings', 'landmarks', 'link-text', 'interactive'],
  debounceMs: 1000,
};
