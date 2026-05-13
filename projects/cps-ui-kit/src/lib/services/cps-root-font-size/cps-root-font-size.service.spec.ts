import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import {
  CpsRootFontSizeService,
  CPS_ROOT_FONT_SIZE_SERVICE
} from './cps-root-font-size.service';

const SENTINEL_ATTR = 'data-cps-root-font-size-sentinel';

describe('CpsRootFontSizeService', () => {
  let service: CpsRootFontSizeService;
  let document: Document;
  let resizeCallback: (entries: unknown[], observer: unknown) => void;
  let mockObserve: jest.Mock;
  let mockDisconnect: jest.Mock;
  let computedFontSize: string;

  beforeEach(() => {
    computedFontSize = '16px';
    mockObserve = jest.fn();
    mockDisconnect = jest.fn();

    (globalThis as any).ResizeObserver = jest.fn(
      (cb: (entries: unknown[], observer: unknown) => void) => {
        resizeCallback = cb;
        return { observe: mockObserve, disconnect: mockDisconnect };
      }
    );

    jest
      .spyOn(window, 'getComputedStyle')
      .mockReturnValue({ fontSize: computedFontSize } as CSSStyleDeclaration);

    TestBed.configureTestingModule({});
    service = TestBed.inject(CpsRootFontSizeService);
    document = TestBed.inject(DOCUMENT);
  });

  afterEach(() => {
    service.ngOnDestroy();
    jest.restoreAllMocks();
    delete (globalThis as any).ResizeObserver;
    document
      .querySelectorAll(`[${SENTINEL_ATTR}]`)
      .forEach((el) => el.remove());
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize fontSize from getComputedStyle', () => {
    expect(service.fontSize()).toBe(16);
  });

  it('should append a sentinel element to the document root', () => {
    const sentinel = document.querySelector(`[${SENTINEL_ATTR}]`);
    expect(sentinel).not.toBeNull();
    expect(document.documentElement.contains(sentinel)).toBe(true);
  });

  it('should set sentinel style to width:1rem and be hidden', () => {
    const sentinel = document.querySelector<HTMLElement>(`[${SENTINEL_ATTR}]`)!;
    expect(sentinel.style.width).toBe('1rem');
    expect(sentinel.style.height).toBe('0px');
    expect(sentinel.style.visibility).toBe('hidden');
    expect(sentinel.style.position).toBe('absolute');
    expect(sentinel.style.pointerEvents).toBe('none');
  });

  it('should start observing the sentinel element', () => {
    expect(mockObserve).toHaveBeenCalledTimes(1);
    const sentinel = document.querySelector(`[${SENTINEL_ATTR}]`);
    expect(mockObserve).toHaveBeenCalledWith(sentinel);
  });

  it('should update fontSize signal when ResizeObserver fires with a new size', () => {
    (window.getComputedStyle as jest.Mock).mockReturnValue({
      fontSize: '20px'
    } as CSSStyleDeclaration);

    resizeCallback([], null as unknown as ResizeObserver);

    expect(service.fontSize()).toBe(20);
  });

  it('should not update fontSize signal when the size has not changed', () => {
    resizeCallback([], null as unknown as ResizeObserver);
    expect(service.fontSize()).toBe(16);
  });

  describe('ngOnDestroy', () => {
    it('should disconnect the ResizeObserver', () => {
      service.ngOnDestroy();
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });

    it('should not remove the sentinel element on destroy', () => {
      service.ngOnDestroy();
      expect(document.querySelector(`[${SENTINEL_ATTR}]`)).not.toBeNull();
    });

    it('should null out internal references after destroy', () => {
      service.ngOnDestroy();
      expect(() => service.ngOnDestroy()).not.toThrow();
    });
  });

  describe('sentinel reuse (microfrontend scenario)', () => {
    it('should reuse the existing sentinel when a second instance is created', () => {
      const service2 = TestBed.runInInjectionContext(
        () => new CpsRootFontSizeService()
      );

      expect(document.querySelectorAll(`[${SENTINEL_ATTR}]`).length).toBe(1);

      service2.ngOnDestroy();
    });

    it('should keep the sentinel alive when the non-owning instance is destroyed', () => {
      const service2 = TestBed.runInInjectionContext(
        () => new CpsRootFontSizeService()
      );

      service2.ngOnDestroy();
      expect(document.querySelector(`[${SENTINEL_ATTR}]`)).not.toBeNull();
    });

    it('should keep the sentinel alive when the owning (first) instance is destroyed while another is active', () => {
      const service2 = TestBed.runInInjectionContext(
        () => new CpsRootFontSizeService()
      );

      service.ngOnDestroy();
      expect(document.querySelector(`[${SENTINEL_ATTR}]`)).not.toBeNull();
      service2.ngOnDestroy();
    });

    it('should keep tracking after the owning instance is destroyed: surviving instance still updates on resize', () => {
      const callbacks: ((entries: unknown[], observer: unknown) => void)[] = [];
      (globalThis as any).ResizeObserver = jest.fn(
        (cb: (entries: unknown[], observer: unknown) => void) => {
          callbacks.push(cb);
          return { observe: mockObserve, disconnect: mockDisconnect };
        }
      );

      const service2 = TestBed.runInInjectionContext(
        () => new CpsRootFontSizeService()
      );

      service.ngOnDestroy();

      (window.getComputedStyle as jest.Mock).mockReturnValue({
        fontSize: '20px'
      } as CSSStyleDeclaration);

      callbacks[0]([], null as unknown as ResizeObserver);

      expect(service2.fontSize()).toBe(20);
      service2.ngOnDestroy();
    });

    it('should keep the sentinel alive even after all instances are destroyed', () => {
      const service2 = TestBed.runInInjectionContext(
        () => new CpsRootFontSizeService()
      );

      service.ngOnDestroy();
      service2.ngOnDestroy();

      expect(document.querySelector(`[${SENTINEL_ATTR}]`)).not.toBeNull();
    });
  });
});

describe('CpsRootFontSizeService (SSR)', () => {
  beforeEach(() => {
    (globalThis as any).ResizeObserver = jest.fn(() => ({
      observe: jest.fn(),
      disconnect: jest.fn()
    }));
    jest
      .spyOn(window, 'getComputedStyle')
      .mockReturnValue({ fontSize: '16px' } as CSSStyleDeclaration);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete (globalThis as any).ResizeObserver;
  });

  it('should initialize fontSize to 16 in SSR', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }]
    });
    const service = TestBed.inject(CpsRootFontSizeService);
    expect(service.fontSize()).toBe(16);
  });

  it('should not create a sentinel element in SSR', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }]
    });
    TestBed.inject(CpsRootFontSizeService);
    const doc = TestBed.inject(DOCUMENT);
    expect(doc.querySelector(`[${SENTINEL_ATTR}]`)).toBeNull();
  });

  it('should not create a ResizeObserver in SSR', () => {
    const observerCtor = (globalThis as any).ResizeObserver as jest.Mock;
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }]
    });
    TestBed.inject(CpsRootFontSizeService);
    expect(observerCtor).not.toHaveBeenCalled();
  });
});

describe('CPS_ROOT_FONT_SIZE_SERVICE token', () => {
  beforeEach(() => {
    (globalThis as any).ResizeObserver = jest.fn(() => ({
      observe: jest.fn(),
      disconnect: jest.fn()
    }));
    jest
      .spyOn(window, 'getComputedStyle')
      .mockReturnValue({ fontSize: '16px' } as CSSStyleDeclaration);

    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    TestBed.inject(CpsRootFontSizeService).ngOnDestroy();
    jest.restoreAllMocks();
    delete (globalThis as any).ResizeObserver;
    TestBed.inject(DOCUMENT)
      .querySelectorAll(`[${SENTINEL_ATTR}]`)
      .forEach((el) => el.remove());
  });

  it('should resolve to the CpsRootFontSizeService singleton', () => {
    const token = TestBed.inject(CPS_ROOT_FONT_SIZE_SERVICE);
    const direct = TestBed.inject(CpsRootFontSizeService);
    expect(token).toBe(direct);
  });
});
