import { REDUCED_MOTION_DURATION, prefersReducedMotion } from './motion-utils';

describe('motion-utils', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should export a near-instant reduced motion duration', () => {
    expect(REDUCED_MOTION_DURATION).toBe('1ms');
  });

  it('should return false when the OS has no reduced-motion preference', () => {
    jest.spyOn(window, 'matchMedia').mockReturnValue({
      matches: false
    } as MediaQueryList);

    expect(prefersReducedMotion()).toBe(false);
  });

  it('should return true when the OS prefers reduced motion', () => {
    jest.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true
    } as MediaQueryList);

    expect(prefersReducedMotion()).toBe(true);
  });

  it('should query the correct media feature', () => {
    const spy = jest
      .spyOn(window, 'matchMedia')
      .mockReturnValue({ matches: false } as MediaQueryList);

    prefersReducedMotion();

    expect(spy).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  });
});
