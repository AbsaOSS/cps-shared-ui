import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import {
  CpsRootFontSizeService,
  CPS_ROOT_FONT_SIZE_SERVICE
} from './cps-root-font-size.service';

const SENTINEL_ATTR = 'data-cps-root-font-size-sentinel';

describe('CpsRootFontSizeService', () => {
  let service: CpsRootFontSizeService;
  let document: Document;
  let resizeCallback: ResizeObserverCallback;
  let mockObserve: jest.Mock;
  let mockDisconnect: jest.Mock;
  let computedFontSize: string;

  beforeEach(() => {
    computedFontSize = '16px';
    mockObserve = jest.fn();
    mockDisconnect = jest.fn();

    (globalThis as any).ResizeObserver = jest.fn(
      (cb: ResizeObserverCallback) => {
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

  it('should NOT update fontSize signal when the size has not changed', () => {
    resizeCallback([], null as unknown as ResizeObserver);
    expect(service.fontSize()).toBe(16);
  });

  describe('ngOnDestroy', () => {
    it('should disconnect the ResizeObserver', () => {
      service.ngOnDestroy();
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });

    it('should remove the sentinel element when owned', () => {
      const sentinel = document.querySelector(`[${SENTINEL_ATTR}]`);
      expect(sentinel).not.toBeNull();

      service.ngOnDestroy();

      expect(document.querySelector(`[${SENTINEL_ATTR}]`)).toBeNull();
    });

    it('should null out internal references after destroy', () => {
      service.ngOnDestroy();
      expect(() => service.ngOnDestroy()).not.toThrow();
    });
  });

  describe('sentinel reuse (microfrontend scenario)', () => {
    it('should reuse an existing sentinel and NOT remove it on destroy', () => {
      const service2 = TestBed.runInInjectionContext(
        () => new CpsRootFontSizeService()
      );

      const sentinels = document.querySelectorAll(`[${SENTINEL_ATTR}]`);
      expect(sentinels.length).toBe(1);

      service2.ngOnDestroy();

      expect(document.querySelector(`[${SENTINEL_ATTR}]`)).not.toBeNull();
    });
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
