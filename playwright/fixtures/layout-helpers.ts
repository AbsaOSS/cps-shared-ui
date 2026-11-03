import { expect, type CDPSession, type Page } from '@playwright/test';

/**
 * Layout measurements for WCAG 1.4.10 (Reflow) and 1.4.4 (Resize Text).
 * axe-core can't check either: it has no rule for 1.4.10, its only 1.4.4 rule
 * (meta-viewport) checks that zoom isn't blocked, and it never resizes the page.
 */

/** Chrome's default font size, which setBrowserFontSize() changes. */
const DEFAULT_FONT_SIZE = 16;

/** Browser font size for the 200% text check. */
export const TEXT_200_FONT_SIZE = 2 * DEFAULT_FONT_SIZE;

/** Most elements listed in one failure message; the attached report has them all. */
const MAX_LISTED = 15;

/** An element whose content is wider or taller than its box. */
export interface OverflowingBox {
  element: string;
  /** Computed `overflow-x overflow-y`. */
  overflow: string;
  scrollWidth: number;
  clientWidth: number;
  scrollHeight: number;
  clientHeight: number;
  /** For a container around the component: the element that sticks out of it. */
  cause?: string;
}

/** A visible element that sticks out of the viewport horizontally. */
export interface OffscreenElement {
  element: string;
  left: number;
  right: number;
}

/** A text element whose computed font size didn't double with the browser font size. */
export interface UnscaledText {
  element: string;
  before: number;
  after: number;
}

/** The text check's reading at the default browser font size. */
interface TextScalingReading {
  unscaled: UnscaledText[];
  /** Text elements removed since the 200% reading, which can't be compared. */
  removed: string[];
}

export interface LayoutReport {
  viewportWidth: number;
  /** The document, or a container around the component, scrolls or clips sideways. */
  pageOverflow: OverflowingBox[];
  /** Elements of the component that extend past the left or right edge of the viewport. */
  offscreen: OffscreenElement[];
  /** Containers in the component that hide part of their content. */
  clipped: OverflowingBox[];
  /** Containers in the component that scroll sideways without an allowance. */
  innerScroll: OverflowingBox[];
  /** Text truncated with an ellipsis without an allowance. */
  ellipsis: OverflowingBox[];
  /** Allowed scroll containers and ellipses that did overflow (informational). */
  allowed: OverflowingBox[];
}

export interface LayoutAllowances {
  /** Containers that may scroll sideways because their content needs two dimensions. */
  scrollContainers: string[];
  /** Elements that may truncate with an ellipsis because the full text is available another way. */
  ellipsis: string[];
}

type ProbeArgs =
  | { mode: 'layout'; selectors: string[]; allowances: LayoutAllowances }
  | {
      mode: 'text-scaling';
      selectors: string[];
      phase: 'enlarged' | 'default';
    };

/**
 * Runs inside the page (serialized by page.evaluate), so everything it uses
 * is declared inside it. Measures the entry's selector(s) plus all their
 * descendants, skipping elements that aren't rendered, have no size, or are
 * visually hidden (such as `.cps-sr-only`).
 */
function layoutProbe(
  args: ProbeArgs
): LayoutReport | TextScalingReading | null {
  // Slack for sub-pixel rounding, used in every comparison.
  const TOLERANCE = 1;
  const TEXT_FIELDS =
    'input:not([type="checkbox"], [type="radio"], [type="file"], [type="hidden"], [type="range"], [type="color"], [type="button"], [type="submit"], [type="reset"], [type="image"]), textarea, select';
  const INTERACTIVE =
    'a[href], button, input, select, textarea, [tabindex], [role="button"], [role="link"], [role="tab"], [role="option"], [role="menuitem"], [role="checkbox"], [role="radio"], [role="switch"]';
  const root = document.documentElement;
  const viewportWidth = root.clientWidth;
  const round = (n: number) => Math.round(n * 10) / 10;

  function describe(el: Element): string {
    const id = el.id ? `#${el.id}` : '';
    const classes = Array.from(el.classList)
      .slice(0, 3)
      .map((c) => `.${c}`)
      .join('');
    const raw = el.matches(TEXT_FIELDS)
      ? (el as HTMLInputElement).value || el.getAttribute('placeholder') || ''
      : el.textContent || '';
    const text = raw.replace(/\s+/g, ' ').trim();
    const shown = text.length > 40 ? `${text.slice(0, 40)}…` : text;
    return `<${el.tagName.toLowerCase()}${id}${classes}>${shown ? ` "${shown}"` : ''}`;
  }

  const clippedAway = new Map<Element, boolean>();

  /** Visually hidden by `clip: rect(0 0 0 0)` or `clip-path: inset(50%)`, itself or through an ancestor. */
  function isClippedAway(el: Element | null): boolean {
    if (!el || el === root) return false;
    let result = clippedAway.get(el);
    if (result === undefined) {
      const style = getComputedStyle(el);
      result =
        style.clip === 'rect(0px, 0px, 0px, 0px)' ||
        style.clipPath === 'inset(50%)' ||
        isClippedAway(el.parentElement);
      clippedAway.set(el, result);
    }
    return result;
  }

  function isVisible(el: Element): boolean {
    if (
      !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })
    )
      return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && !isClippedAway(el);
  }

  function hasOwnText(el: Element): boolean {
    return Array.from(el.childNodes).some(
      (n) => n.nodeType === Node.TEXT_NODE && !!n.textContent?.trim()
    );
  }

  /** Visible text or a visible control: decorative overflow (spinners, stripes) doesn't count. */
  function hasVisibleContent(el: Element): boolean {
    if (
      el.matches(INTERACTIVE) ||
      Array.from(el.querySelectorAll(INTERACTIVE)).some(isVisible)
    )
      return true;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (
        n.textContent?.trim() &&
        n.parentElement &&
        isVisible(n.parentElement)
      )
        return true;
    }
    return false;
  }

  function measureBox(el: Element): OverflowingBox {
    const style = getComputedStyle(el);
    return {
      element: el === root ? '<html> (the page)' : describe(el),
      overflow: `${style.overflowX} ${style.overflowY}`,
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight
    };
  }

  const matchesAny = (el: Element, selectors: string[]) =>
    selectors.some((s) => el.matches(s));
  const hides = (overflow: string) =>
    overflow === 'hidden' || overflow === 'clip';
  const scrolls = (overflow: string) =>
    overflow === 'auto' || overflow === 'scroll';

  // The text check reads font sizes in two calls, at 200% and then at the
  // default browser font size, so the elements and their 200% sizes wait on
  // window in between. Transitions are frozen meanwhile: an element with a
  // font-size transition would otherwise still report its old size.
  const FREEZE_ID = 'a11y-freeze-transitions';
  const textState = window as unknown as {
    a11yTextScaling?: { texts: Element[]; after: number[] };
  };
  const fontSize = (el: Element) => parseFloat(getComputedStyle(el).fontSize);
  if (args.mode === 'text-scaling' && args.phase === 'default') {
    const saved = textState.a11yTextScaling;
    delete textState.a11yTextScaling;
    if (!saved) throw new Error('The 200% font sizes were not recorded');
    const reading: TextScalingReading = { unscaled: [], removed: [] };
    saved.texts.forEach((el, i) => {
      if (!el.isConnected) {
        reading.removed.push(describe(el));
        return;
      }
      const before = fontSize(el);
      const after = saved.after[i];
      if (before > 0 && Math.abs(after / before - 2) > 0.01)
        reading.unscaled.push({ element: describe(el), before, after });
    });
    document.getElementById(FREEZE_ID)?.remove();
    return reading;
  }

  const roots = Array.from(
    new Set(
      args.selectors.flatMap((s) => Array.from(document.querySelectorAll(s)))
    )
  );
  const scopeSet = new Set<Element>();
  for (const r of roots) {
    scopeSet.add(r);
    r.querySelectorAll('*').forEach((el) => scopeSet.add(el));
  }
  // Document order, so ancestors come before their descendants.
  const scope = Array.from(scopeSet).sort((a, b) =>
    a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
  );
  const visible = scope.filter(isVisible);

  if (args.mode === 'text-scaling') {
    const freeze = document.createElement('style');
    freeze.id = FREEZE_ID;
    freeze.textContent =
      '*, *::before, *::after { transition: none !important; }';
    document.head.appendChild(freeze);
    const texts = visible.filter(
      (el) => hasOwnText(el) || el.matches(TEXT_FIELDS)
    );
    textState.a11yTextScaling = { texts, after: texts.map(fontSize) };
    return null;
  }

  // Infinite animations are decorative (spinners, indeterminate bars); a
  // rotating box has a growing bounding rect, so measure their first frame.
  for (const animation of document.getAnimations()) {
    if (animation.effect?.getTiming().iterations === Infinity) {
      animation.pause();
      animation.currentTime = 0;
    }
  }

  const { allowances } = args;
  const report: LayoutReport = {
    viewportWidth,
    pageOverflow: [],
    offscreen: [],
    clipped: [],
    innerScroll: [],
    ellipsis: [],
    allowed: []
  };

  interface Clipping {
    /**
     * The nearest ancestor that scrolls or clips it horizontally; null if
     * only the document does or, when fixed, the viewport.
     */
    container: Element | null;
    fixed: boolean;
    /**
     * Laid out directly in the container: a child (through `display:
     * contents` too) or an inline-level box in its lines. Only then does
     * the container's end padding scroll with it.
     */
    direct: boolean;
  }
  const clippings = new Map<Element, Clipping>();

  /**
   * How `el` is scrolled or clipped horizontally. Follows the containing
   * block chain at every step, so content inside a fixed overlay (fullscreen
   * loader) isn't attributed to the docs containers.
   */
  function clipping(el: Element): Clipping {
    let result = clippings.get(el);
    if (result) return result;
    result = { container: null, fixed: false, direct: true };
    let style = getComputedStyle(el);
    const inline = style.display.startsWith('inline');
    for (let current = el; ;) {
      if (style.position === 'fixed') {
        result.fixed = true; // only the viewport clips it; see check 2
        break;
      }
      const absolute = style.position === 'absolute';
      if (absolute) result.direct = false;
      const next: Element | null = absolute
        ? ((current as HTMLElement).offsetParent ?? current.parentElement)
        : current.parentElement;
      if (!next || next === root || next === document.body) break;
      style = getComputedStyle(next);
      if (style.overflowX !== 'visible') {
        result.container = next;
        break;
      }
      if (
        style.display !== 'contents' &&
        !(inline && style.display === 'inline')
      )
        result.direct = false;
      current = next;
    }
    clippings.set(el, result);
    return result;
  }

  // Elements clipped by each container inside the component. Content inside
  // an allowed scroll container is skipped by checks 1 and 2 this way, unless
  // it escapes the container.
  const clippedBy = new Map<Element, Element[]>();
  for (const el of visible) {
    const { container } = clipping(el);
    if (!container || !scopeSet.has(container)) continue;
    const clipped = clippedBy.get(container);
    if (clipped) clipped.push(el);
    else clippedBy.set(container, [el]);
  }

  // 1. The page doesn't scroll sideways: the document, and every scroll or clip
  // container around the component (the docs app scrolls inside #main-content,
  // .composition-page and .code-example__preview rather than the document).
  // Containers are judged by the component's boxes against the container's
  // box, not by its scrollWidth: Chromium can keep a stale scrollWidth after a
  // transform animation (e.g. a cps-tab-group panel sliding in). A scroll
  // container also scrolls its end padding with the boxes laid out directly
  // in it (measured before transforms and relative offsets, so its
  // scrollWidth confirms it); other content may reach into that padding.
  if (root.scrollWidth > root.clientWidth + TOLERANCE) {
    const widening = visible.find((el) => {
      const { container, fixed } = clipping(el);
      return (
        !container &&
        !fixed &&
        el.getBoundingClientRect().right > viewportWidth + TOLERANCE
      );
    });
    report.pageOverflow.push({
      ...measureBox(root),
      cause: widening
        ? `${describe(widening)} reaches x ${round(widening.getBoundingClientRect().right)}px, the viewport ${viewportWidth}px`
        : 'no element of the component reaches past the viewport, so content around it widens the page'
    });
  }
  const overflowedContainers = new Set<Element>();
  for (const el of visible) {
    const { container, direct } = clipping(el);
    if (
      !container ||
      scopeSet.has(container) ||
      overflowedContainers.has(container)
    )
      continue;
    const box = container.getBoundingClientRect();
    const left = box.left + container.clientLeft;
    let right = left + container.clientWidth;
    const rect = el.getBoundingClientRect();
    const containerStyle = getComputedStyle(container);
    if (
      direct &&
      scrolls(containerStyle.overflowX) &&
      container.scrollWidth > container.clientWidth + TOLERANCE
    )
      right -= parseFloat(containerStyle.paddingRight);
    if (rect.left < left - TOLERANCE || rect.right > right + TOLERANCE) {
      overflowedContainers.add(container);
      report.pageOverflow.push({
        ...measureBox(container),
        cause: `${describe(el)} spans x ${round(rect.left)} to ${round(rect.right)}px, the container x ${round(left)} to ${round(right)}px`
      });
    }
  }

  // 2. Nothing is pushed off-screen. Raw rects on purpose: content scrolled out
  // of view inside a docs container is still off-screen for the user. Content
  // clipped by a container inside the component is left to that container
  // (checked here itself, and by check 3 if it hides real content).
  const offscreen: Element[] = [];
  for (const el of visible) {
    if (offscreen.some((o) => o.contains(el))) continue;
    const { container } = clipping(el);
    if (container && scopeSet.has(container)) continue;
    const rect = el.getBoundingClientRect();
    if (rect.left < -TOLERANCE || rect.right > viewportWidth + TOLERANCE) {
      offscreen.push(el);
      report.offscreen.push({
        element: describe(el),
        left: round(rect.left),
        right: round(rect.right)
      });
    }
  }

  // 3. No content is cut off. Vertical scrolling inside a container is fine;
  // sideways scrolling needs an allowance, hiding content in either direction
  // is reported (an ellipsis only passes with an allowance). An allowance
  // covers sideways overflow only, including `overflow: hidden` containers
  // scrolled by script (the tree table header); hiding content vertically is
  // still reported. scrollWidth/scrollHeight leave out content past the start
  // (left/top) edge, which can't be scrolled to, so that's measured from the
  // clipped text and controls. A box squeezed to 0px wide still clips its
  // content; boxes 0px high are left out, as that's how panels collapse.
  const squeezed = scope.filter((el) => {
    if (
      !el.checkVisibility({
        opacityProperty: true,
        visibilityProperty: true
      }) ||
      isClippedAway(el)
    )
      return false;
    const rect = el.getBoundingClientRect();
    return rect.width === 0 && rect.height > 0;
  });
  for (const el of [...visible, ...squeezed]) {
    if (el.matches(TEXT_FIELDS)) continue; // native fields scroll their own value
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const originLeft = rect.left + el.clientLeft - el.scrollLeft;
    const originTop = rect.top + el.clientTop - el.scrollTop;
    const clippedContent = (clippedBy.get(el) ?? []).filter(
      (c) => hasOwnText(c) || c.matches(INTERACTIVE)
    );
    const cutLeft = clippedContent.find(
      (c) => c.getBoundingClientRect().left < originLeft - TOLERANCE
    );
    const cutTop = clippedContent.find(
      (c) => c.getBoundingClientRect().top < originTop - TOLERANCE
    );
    const overX =
      style.overflowX !== 'visible' &&
      el.scrollWidth > el.clientWidth + TOLERANCE;
    const overY =
      style.overflowY !== 'visible' &&
      el.scrollHeight > el.clientHeight + TOLERANCE;
    const hidesX = (overX && hides(style.overflowX)) || !!cutLeft;
    const hidesY = (overY && hides(style.overflowY)) || !!cutTop;
    const scrollsX = overX && scrolls(style.overflowX);
    if (!hidesX && !hidesY && !scrollsX) continue;
    if (!hasVisibleContent(el) && !(rect.width === 0 && hasOwnText(el)))
      continue;

    const cut = cutLeft ?? cutTop;
    const box: OverflowingBox = cut
      ? {
          ...measureBox(el),
          cause: `${describe(cut)} starts before the container's ${cutLeft ? 'left' : 'top'} edge`
        }
      : measureBox(el);
    if (!hidesY && !cutLeft && matchesAny(el, allowances.scrollContainers)) {
      report.allowed.push(box);
    } else if (
      hidesX &&
      !hidesY &&
      !cutLeft &&
      style.textOverflow === 'ellipsis'
    ) {
      (matchesAny(el, allowances.ellipsis)
        ? report.allowed
        : report.ellipsis
      ).push(box);
    } else if (hidesX || hidesY) {
      report.clipped.push(box);
    } else {
      report.innerScroll.push(box);
    }
  }

  return report;
}

function toSelectorList(selector: string | string[]) {
  return Array.isArray(selector) ? selector : [selector];
}

/**
 * Waits until the layout of the given selector(s), their descendants and
 * ancestors stops changing for 10 frames in a row (at most 3s). Components
 * that size themselves after rendering (tables syncing column widths,
 * overlays positioning, tab panels switching) would otherwise be measured
 * mid-way. Infinite animations (spinners, indeterminate bars) never settle,
 * so they're paused at their first frame first, as the measurement does.
 * Resolves to false if the layout was still changing after 3s.
 */
export async function waitForStableLayout(
  page: Page,
  selector: string | string[]
): Promise<boolean> {
  return page.evaluate(
    (selectors) =>
      new Promise<boolean>((resolve) => {
        for (const animation of document.getAnimations()) {
          if (animation.effect?.getTiming().iterations === Infinity) {
            animation.pause();
            animation.currentTime = 0;
          }
        }
        const signature = () => {
          const parts: string[] = [];
          for (const s of selectors) {
            for (const r of Array.from(document.querySelectorAll(s))) {
              const related = [r, ...Array.from(r.querySelectorAll('*'))];
              for (let a = r.parentElement; a; a = a.parentElement)
                related.push(a);
              for (const el of related) {
                if (!(el instanceof HTMLElement)) continue;
                parts.push(
                  `${el.offsetLeft},${el.offsetTop},${el.offsetWidth},${el.offsetHeight},${el.scrollWidth}`
                );
              }
            }
          }
          return parts.join(';');
        };
        const deadline = performance.now() + 3000;
        let last = signature();
        let stableFrames = 0;
        const tick = () => {
          const current = signature();
          stableFrames = current === last ? stableFrames + 1 : 0;
          last = current;
          if (stableFrames >= 10) resolve(true);
          else if (performance.now() > deadline) resolve(false);
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
    toSelectorList(selector)
  );
}

/** Measures the reflow checks for the given selector(s) at the current viewport. */
export async function measureLayout(
  page: Page,
  selector: string | string[],
  allowances: LayoutAllowances
): Promise<LayoutReport> {
  const args: ProbeArgs = {
    mode: 'layout',
    selectors: toSelectorList(selector),
    allowances
  };
  return (await page.evaluate(layoutProbe, args)) as LayoutReport;
}

const fontSizeSessions = new WeakMap<Page, CDPSession>();

/**
 * Sets the browser's default font size, as a user does in the browser
 * settings (Chrome only), then waits two frames so ResizeObserver-driven
 * re-measuring (CpsRootFontSizeService) runs. Unlike a CSS root font size,
 * this also moves rem-based media queries, and an app that fixes its root
 * font size in px doesn't follow it. The setting carries over to later
 * navigations, but only while its DevTools session stays open, so there's
 * one session per page.
 */
export async function setBrowserFontSize(page: Page, px: number) {
  let session = fontSizeSessions.get(page);
  if (!session) {
    session = await page.context().newCDPSession(page);
    fontSizeSessions.set(page, session);
  }
  await session.send('Page.setFontSizes', {
    fontSizes: { standard: px, fixed: Math.round((px * 13) / 16) }
  });
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
  );
}

/** Reads the font sizes at 200%, then at the default size, then restores 200%. */
async function readTextScaling(
  page: Page,
  selectors: string[]
): Promise<TextScalingReading> {
  const enlarged: ProbeArgs = {
    mode: 'text-scaling',
    selectors,
    phase: 'enlarged'
  };
  await page.evaluate(layoutProbe, enlarged);
  try {
    await setBrowserFontSize(page, DEFAULT_FONT_SIZE);
    const atDefault: ProbeArgs = {
      mode: 'text-scaling',
      selectors,
      phase: 'default'
    };
    return (await page.evaluate(layoutProbe, atDefault)) as TextScalingReading;
  } finally {
    await setBrowserFontSize(page, TEXT_200_FONT_SIZE);
  }
}

/**
 * After setBrowserFontSize(page, TEXT_200_FONT_SIZE): returns the visible text
 * elements whose computed font size isn't double their size at the default
 * browser font size, i.e. are sized in px (directly, through an ancestor or
 * a px root font size) instead of rem or em. Switches to the default size and
 * back, so measure the layout first. Rem media queries switch with it (the
 * kit's 40rem rules apply only to the 200% reading at 1280px), so a font size
 * set in one shows up here too.
 */
export async function measureTextScaling(
  page: Page,
  selector: string | string[]
): Promise<UnscaledText[]> {
  const selectors = toSelectorList(selector);
  // Text removed in between (a toast closing on its timer) can't be compared,
  // so the sizes are read once more; text removed again is re-rendered by
  // the font size change itself.
  for (let attempt = 1; ; attempt++) {
    const { unscaled, removed } = await readTextScaling(page, selectors);
    if (!removed.length) return unscaled;
    if (attempt === 2)
      throw new Error(
        `${removed.length} text elements were removed when the browser font size changed, so their scaling can't be compared: ${removed.slice(0, 5).join(', ')}`
      );
  }
}

function formatList(lines: string[]): string {
  const listed = lines.slice(0, MAX_LISTED).map((line) => `  - ${line}`);
  if (lines.length > MAX_LISTED)
    listed.push(
      `  …and ${lines.length - MAX_LISTED} more (see the attached report)`
    );
  return listed.join('\n');
}

function formatBoxes(boxes: OverflowingBox[]): string {
  return formatList(
    boxes.map(
      (b) =>
        `${b.element}: content ${b.scrollWidth}×${b.scrollHeight}px in a ${b.clientWidth}×${b.clientHeight}px box (overflow: ${b.overflow})${b.cause ? `\n      because ${b.cause}` : ''}`
    )
  );
}

/** One soft assertion per reflow check, each naming the component, elements and sizes. */
export function expectNoLayoutIssues(report: LayoutReport, label: string) {
  const width = report.viewportWidth;
  expect
    .soft(
      report.pageOverflow,
      `${label}: the page scrolls sideways at ${width}px\n${formatBoxes(report.pageOverflow)}`
    )
    .toHaveLength(0);
  expect
    .soft(
      report.offscreen,
      `${label}: elements outside the ${width}px viewport\n${formatList(
        report.offscreen.map(
          (o) => `${o.element}: spans x ${o.left} to ${o.right}px`
        )
      )}`
    )
    .toHaveLength(0);
  expect
    .soft(
      report.clipped,
      `${label}: content cut off\n${formatBoxes(report.clipped)}`
    )
    .toHaveLength(0);
  expect
    .soft(
      report.innerScroll,
      `${label}: content scrolls sideways inside the component without an allowance\n${formatBoxes(report.innerScroll)}`
    )
    .toHaveLength(0);
  expect
    .soft(
      report.ellipsis,
      `${label}: text truncated with an ellipsis without an allowance\n${formatBoxes(report.ellipsis)}`
    )
    .toHaveLength(0);
}

export function expectTextScales(unscaled: UnscaledText[], label: string) {
  expect
    .soft(
      unscaled,
      `${label}: text that doesn't double with a 200% browser font size (px on the element, an ancestor or the root)\n${formatList(
        unscaled.map(
          (t) =>
            `${t.element}: ${t.before}px → ${t.after}px, expected ${t.before * 2}px`
        )
      )}`
    )
    .toHaveLength(0);
}
