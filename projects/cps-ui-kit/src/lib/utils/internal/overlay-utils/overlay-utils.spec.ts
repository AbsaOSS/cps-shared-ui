import { markOverlayShown, overlayShownCount } from './overlay-utils';

describe('overlay-utils', () => {
  it('should count nothing for an overlay never marked shown', () => {
    expect(overlayShownCount(document.createElement('div'))).toBe(0);
  });

  it('should count each time an overlay is marked shown', () => {
    const overlay = document.createElement('div');
    markOverlayShown(overlay);
    markOverlayShown(overlay);

    expect(overlayShownCount(overlay)).toBe(2);
  });

  it('should count each overlay separately', () => {
    const marked = document.createElement('div');
    markOverlayShown(marked);

    expect(overlayShownCount(document.createElement('div'))).toBe(0);
  });
});
