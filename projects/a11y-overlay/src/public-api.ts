/*
 * Public API Surface of a11y-overlay
 */

// Models
export { A11yIssue, A11yImpact, A11yCategory, ElementHighlight, worstImpact } from './lib/models/a11y-issue.model';
export { A11yOverlayConfig, A11yScanTrigger, A11Y_OVERLAY_CONFIG } from './lib/models/a11y-config.model';

// Provider
export { provideA11yOverlay } from './lib/providers/provide-a11y-overlay';

// Service
export { A11yOverlayService } from './lib/services/a11y-overlay.service';

// Root component
export { A11yOverlayComponent } from './lib/components/a11y-overlay.component';

// Scanner interface (for custom scanners)
export { Scanner } from './lib/scanners/scanner.interface';
