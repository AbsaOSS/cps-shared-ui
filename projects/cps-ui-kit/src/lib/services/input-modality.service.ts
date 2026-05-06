import {
  inject,
  Injectable,
  InjectionToken,
  PLATFORM_ID,
  signal
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
class InputModalityService {
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _document = inject(DOCUMENT);

  readonly lastInput = signal<'keyboard' | 'pointer'>('pointer');

  constructor() {
    if (!isPlatformBrowser(this._platformId)) return;

    this._document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab' || e.key === 'Enter' || e.key === ' ') {
        this.lastInput.set('keyboard');
      }
    });

    this._document.addEventListener('pointerdown', () => {
      this.lastInput.set('pointer');
    });
  }
}

export const INPUT_MODALITY_SERVICE =
  new InjectionToken<InputModalityService | null>('InputModalityService', {
    providedIn: 'root',
    factory: () => inject(InputModalityService)
  });
