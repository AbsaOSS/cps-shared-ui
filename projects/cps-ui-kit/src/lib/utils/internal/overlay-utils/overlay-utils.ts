const shownCounts = new WeakMap<Element, number>();

/**
 * Records that an overlay showed something new without moving up the z-index stack,
 * e.g. a notification added to a container that is already on top.
 */
export const markOverlayShown = (overlay: Element): void => {
  shownCounts.set(overlay, overlayShownCount(overlay) + 1);
};

/**
 * How many times an overlay was marked shown, so a tooltip can tell what showed after it.
 */
export const overlayShownCount = (overlay: Element): number =>
  shownCounts.get(overlay) ?? 0;
