import { Injectable } from '@angular/core';
import { A11yIssue } from '../models/a11y-issue.model';
import { Scanner } from './scanner.interface';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]',
  '[contenteditable="true"]'
].join(',');

@Injectable()
export class FocusOrderScanner implements Scanner {
  async scan(root: HTMLElement): Promise<A11yIssue[]> {
    const issues: A11yIssue[] = [];
    const focusables = Array.from(
      root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    ).filter((el) => {
      if (el.closest('a11y-overlay')) return false;
      const tabIndex = el.tabIndex;
      const style = getComputedStyle(el);
      return (
        tabIndex >= 0 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden'
      );
    });

    focusables.forEach((el, index) => {
      if (el.tabIndex > 0) {
        issues.push({
          id: `focus-positive-tabindex-${index}`,
          category: 'focus-order',
          element: el,
          selector: this.getSelector(el),
          impact: 'serious',
          message: `Element has tabindex="${el.tabIndex}". Avoid positive tabindex values; they disrupt natural tab order.`
        });
      }
    });

    // Classify each focusable as on-screen or off-screen
    const visibility = focusables.map((el) => {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const isVisible =
        el.getAttribute('aria-hidden') !== 'true' &&
        style.opacity !== '0' &&
        rect.width > 0 &&
        rect.height > 0 &&
        el.offsetParent !== null;

      const isOffScreen =
        isVisible &&
        (rect.right < 0 ||
          rect.bottom < 0 ||
          rect.left > window.innerWidth ||
          rect.top > window.innerHeight);

      return { el, isVisible, isOffScreen };
    });

    // Detect broken flow: on-screen → off-screen → on-screen transitions
    // Group consecutive off-screen elements into segments
    const segments: { start: number; end: number }[] = [];
    let segStart = -1;

    for (let i = 0; i < visibility.length; i++) {
      const { isOffScreen } = visibility[i];
      if (isOffScreen && segStart === -1) {
        segStart = i;
      } else if (!isOffScreen && segStart !== -1) {
        segments.push({ start: segStart, end: i - 1 });
        segStart = -1;
      }
    }
    if (segStart !== -1) {
      segments.push({ start: segStart, end: visibility.length - 1 });
    }

    // Flag off-screen segments that break flow (have on-screen elements both before and after)
    for (const seg of segments) {
      const hasOnScreenBefore = visibility
        .slice(0, seg.start)
        .some((v) => v.isVisible && !v.isOffScreen);
      const hasOnScreenAfter = visibility
        .slice(seg.end + 1)
        .some((v) => v.isVisible && !v.isOffScreen);
      const breaksFlow = hasOnScreenBefore && hasOnScreenAfter;

      for (let i = seg.start; i <= seg.end; i++) {
        const el = visibility[i].el;
        const count = seg.end - seg.start + 1;
        const position = i - seg.start + 1;

        if (breaksFlow) {
          issues.push({
            id: `focus-broken-flow-${i}`,
            category: 'focus-order',
            element: el,
            selector: this.getSelector(el),
            impact: 'serious',
            message:
              `Focus passes through ${count} off-screen element${count > 1 ? 's' : ''} (this is ${position} of ${count}) ` +
              `between visible content. Users will lose sight of the focus indicator while tabbing through ` +
              `these elements (WCAG 2.4.7 Focus Visible). ` +
              `Consider adding tabindex="-1" to remove from tab order, or moving these elements on-screen.`
          });
        } else {
          issues.push({
            id: `focus-offscreen-${i}`,
            category: 'focus-order',
            element: el,
            selector: this.getSelector(el),
            impact: 'moderate',
            message:
              'Focusable element is positioned off-screen. When tabbing reaches this element, ' +
              'the focus indicator will not be visible to the user (WCAG 2.4.7 Focus Visible). ' +
              'Consider adding tabindex="-1" to remove from tab order, or moving it on-screen.'
          });
        }
      }
    }

    return issues;
  }

  private getSelector(el: HTMLElement): string {
    if (el.id) return `#${el.id}`;
    const tag = el.tagName.toLowerCase();
    const classes = Array.from(el.classList).join('.');
    return classes ? `${tag}.${classes}` : tag;
  }
}
