import { getTestBed } from '@angular/core/testing';
import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

// Guard against double-initialisation.
// @angular-builders/jest v20+ injects its own setupZoneTestEnv() before this file runs.
if (!getTestBed().platform) {
  setupZoneTestEnv();
}

window.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
