import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import {
  CpsLiveAnnouncerPoliteness,
  CpsLiveAnnouncerService
} from './cps-live-announcer.service';

describe('CpsLiveAnnouncerService', () => {
  let service: CpsLiveAnnouncerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CpsLiveAnnouncerService);
  });

  afterEach(() => {
    service.ngOnDestroy();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add a polite live region to document.body on creation', () => {
    expect(document.body.querySelector('[aria-live="polite"]')).toBeTruthy();
  });

  it('should add an assertive live region to document.body on creation', () => {
    expect(document.body.querySelector('[aria-live="assertive"]')).toBeTruthy();
  });

  it('should reuse existing live region elements instead of creating duplicates', () => {
    TestBed.inject(CpsLiveAnnouncerService);
    expect(
      document.body.querySelectorAll('.cps-polite-live-announcer-element')
        .length
    ).toBe(1);
    expect(
      document.body.querySelectorAll('.cps-assertive-live-announcer-element')
        .length
    ).toBe(1);
  });

  it('should set aria-atomic="true" on both live regions', () => {
    const polite = document.body.querySelector('[aria-live="polite"]');
    const assertive = document.body.querySelector('[aria-live="assertive"]');
    expect(polite?.getAttribute('aria-atomic')).toBe('true');
    expect(assertive?.getAttribute('aria-atomic')).toBe('true');
  });

  it('should apply the correct classes to each live region element', () => {
    expect(
      document.body.querySelector('.cps-polite-live-announcer-element')
    ).toBeTruthy();
    expect(
      document.body.querySelector('.cps-assertive-live-announcer-element')
    ).toBeTruthy();
  });

  describe('announce', () => {
    it('should set polite live region text on next tick', fakeAsync(() => {
      service.announce('Loading...');
      tick(0);
      expect(
        document.body.querySelector('[aria-live="polite"]')?.textContent
      ).toBe('Loading...');
    }));

    it('should set assertive live region text on next tick', fakeAsync(() => {
      service.announce('Error occurred', 'assertive');
      tick(0);
      expect(
        document.body.querySelector('[aria-live="assertive"]')?.textContent
      ).toBe('Error occurred');
    }));

    it('should default to polite politeness', fakeAsync(() => {
      service.announce('Hello');
      tick(0);
      const politeText = document.body.querySelector(
        '[aria-live="polite"]'
      )?.textContent;
      const assertiveText = document.body.querySelector(
        '[aria-live="assertive"]'
      )?.textContent;
      expect(politeText).toBe('Hello');
      expect(assertiveText).toBe('');
    }));

    it('should clear existing text before setting new text', fakeAsync(() => {
      service.announce('First');
      tick(0);
      service.announce('Second');
      const el = document.body.querySelector('[aria-live="polite"]');
      expect(el?.textContent).toBe('');
      tick(0);
      expect(el?.textContent).toBe('Second');
    }));

    it('should re-announce the same message', fakeAsync(() => {
      service.announce('Loading...');
      tick(0);
      service.announce('Loading...');
      const el = document.body.querySelector('[aria-live="polite"]');
      expect(el?.textContent).toBe('');
      tick(0);
      expect(el?.textContent).toBe('Loading...');
    }));

    it('should clear the region after durationMs', fakeAsync(() => {
      service.announce('Loading...', 'polite', 5000);
      tick(0);
      const el = document.body.querySelector('[aria-live="polite"]');
      expect(el?.textContent).toBe('Loading...');
      tick(5000);
      expect(el?.textContent).toBe('');
    }));

    it('should not clear the region when durationMs is 0', fakeAsync(() => {
      service.announce('Loading...', 'polite', 0);
      tick(0);
      const el = document.body.querySelector('[aria-live="polite"]');
      expect(el?.textContent).toBe('Loading...');
      tick(10000);
      expect(el?.textContent).toBe('Loading...');
    }));

    it('should cancel the clear timer when re-announced before it fires', fakeAsync(() => {
      service.announce('First', 'polite', 2000);
      tick(0);
      service.announce('Second', 'polite', 5000);
      tick(0);
      const el = document.body.querySelector('[aria-live="polite"]');
      tick(2000);
      expect(el?.textContent).toBe('Second');
      tick(3000);
      expect(el?.textContent).toBe('');
    }));
  });

  describe('clear', () => {
    it('should clear the polite region by default', fakeAsync(() => {
      service.announce('Message');
      tick(0);
      service.clear();
      expect(
        document.body.querySelector('[aria-live="polite"]')?.textContent
      ).toBe('');
    }));

    it('should clear the assertive region when specified', fakeAsync(() => {
      service.announce('Alert', 'assertive');
      tick(0);
      service.clear('assertive');
      expect(
        document.body.querySelector('[aria-live="assertive"]')?.textContent
      ).toBe('');
    }));

    it('should cancel the duration timer when clear is called', fakeAsync(() => {
      service.announce('Message', 'polite', 3000);
      tick(0);
      service.clear();
      tick(3000);
      expect(
        document.body.querySelector('[aria-live="polite"]')?.textContent
      ).toBe('');
    }));
  });

  describe('ngOnDestroy', () => {
    it('should remove both live regions from document.body', () => {
      service.ngOnDestroy();
      expect(document.body.querySelector('[aria-live="polite"]')).toBeNull();
      expect(document.body.querySelector('[aria-live="assertive"]')).toBeNull();
    });
  });

  describe('politeness type', () => {
    it.each([['polite'], ['assertive']] as CpsLiveAnnouncerPoliteness[][])(
      'should accept %s politeness',
      fakeAsync((politeness: CpsLiveAnnouncerPoliteness) => {
        service.announce('Test', politeness);
        tick(0);
        expect(
          document.body.querySelector(`[aria-live="${politeness}"]`)
            ?.textContent
        ).toBe('Test');
      })
    );
  });
});
