import { Provider } from '@angular/core';
import {
  A11yOverlayConfig,
  A11Y_OVERLAY_CONFIG,
} from '../models/a11y-config.model';
import { A11yOverlayService } from '../services/a11y-overlay.service';
import { AxeScanner } from '../scanners/axe-scanner';
import { FocusOrderScanner } from '../scanners/focus-order-scanner';
import { HeadingScanner } from '../scanners/heading-scanner';
import { LandmarkScanner } from '../scanners/landmark-scanner';
import { LinkTextScanner } from '../scanners/link-text-scanner';
import { InteractiveScanner } from '../scanners/interactive-scanner';

export function provideA11yOverlay(config?: A11yOverlayConfig): Provider[] {
  return [
    {
      provide: A11Y_OVERLAY_CONFIG,
      useValue: config ?? {},
    },
    A11yOverlayService,
    AxeScanner,
    FocusOrderScanner,
    HeadingScanner,
    LandmarkScanner,
    LinkTextScanner,
    InteractiveScanner,
  ];
}
