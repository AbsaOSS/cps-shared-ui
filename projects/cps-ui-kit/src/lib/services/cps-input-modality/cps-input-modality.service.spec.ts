import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import {
  CpsInputModalityService,
  CPS_INPUT_MODALITY_SERVICE
} from './cps-input-modality.service';

describe('CpsInputModalityService', () => {
  let service: CpsInputModalityService;
  let document: Document;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CpsInputModalityService);
    document = TestBed.inject(DOCUMENT);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should default lastInput to "pointer"', () => {
    expect(service.lastInput()).toBe('pointer');
  });

  describe('keyboard navigation keys', () => {
    const navigationKeys = [
      'Tab',
      'Enter',
      ' ',
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
      'PageUp',
      'PageDown'
    ];

    navigationKeys.forEach((key) => {
      it(`should set lastInput to "keyboard" on "${key}" keydown`, () => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key }));
        expect(service.lastInput()).toBe('keyboard');
      });
    });
  });

  describe('non-navigation keys', () => {
    it('should NOT change lastInput when a non-navigation key is pressed', () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      expect(service.lastInput()).toBe('pointer');
    });

    it('should NOT change lastInput for "Shift" keydown', () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift' }));
      expect(service.lastInput()).toBe('pointer');
    });

    it('should NOT change lastInput for "Escape" keydown', () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(service.lastInput()).toBe('pointer');
    });
  });

  it('should reset lastInput to "pointer" on pointerdown after keyboard input', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
    expect(service.lastInput()).toBe('keyboard');

    document.dispatchEvent(new Event('pointerdown'));
    expect(service.lastInput()).toBe('pointer');
  });

  it('should remain "pointer" when pointerdown fires without prior keyboard input', () => {
    document.dispatchEvent(new Event('pointerdown'));
    expect(service.lastInput()).toBe('pointer');
  });

  it('should alternate correctly between keyboard and pointer events', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(service.lastInput()).toBe('keyboard');

    document.dispatchEvent(new Event('pointerdown'));
    expect(service.lastInput()).toBe('pointer');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(service.lastInput()).toBe('keyboard');
  });
});

describe('CpsInputModalityService (SSR)', () => {
  it('should not register event listeners outside browser', () => {
    const addEventListenerSpy = jest.spyOn(
      Document.prototype,
      'addEventListener'
    );

    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' },
        CpsInputModalityService
      ]
    });
    TestBed.inject(CpsInputModalityService);

    expect(addEventListenerSpy).not.toHaveBeenCalled();
  });
});

describe('CPS_INPUT_MODALITY_SERVICE token', () => {
  it('should resolve to the CpsInputModalityService instance', () => {
    TestBed.configureTestingModule({});
    const token = TestBed.inject(CPS_INPUT_MODALITY_SERVICE);
    const service = TestBed.inject(CpsInputModalityService);
    expect(token).toBe(service);
  });
});
