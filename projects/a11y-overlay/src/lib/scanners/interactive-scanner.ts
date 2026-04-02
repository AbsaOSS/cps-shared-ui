import { Injectable } from '@angular/core';
import { A11yIssue } from '../models/a11y-issue.model';
import { Scanner } from './scanner.interface';

/**
 * Detects elements that appear interactive (click handlers, cursor:pointer)
 * but lack proper ARIA roles, accessible names, or keyboard support.
 */

const INTERACTIVE_TAGS = new Set([
  'a',
  'button',
  'input',
  'select',
  'textarea',
  'summary',
  'details'
]);

const INTERACTIVE_ROLES = new Set([
  'button',
  'link',
  'menuitem',
  'menuitemcheckbox',
  'menuitemradio',
  'option',
  'radio',
  'switch',
  'tab',
  'checkbox',
  'combobox',
  'listbox',
  'searchbox',
  'slider',
  'spinbutton',
  'textbox',
  'gridcell',
  'treeitem'
]);

@Injectable()
export class InteractiveScanner implements Scanner {
  async scan(root: HTMLElement): Promise<A11yIssue[]> {
    const issues: A11yIssue[] = [];
    const allElements = Array.from(
      root.querySelectorAll<HTMLElement>('*')
    ).filter((el) => !el.closest('a11y-overlay'));

    let idx = 0;
    for (const el of allElements) {
      const isNativeInteractive = INTERACTIVE_TAGS.has(
        el.tagName.toLowerCase()
      );
      const role = el.getAttribute('role');
      const hasInteractiveRole = role ? INTERACTIVE_ROLES.has(role) : false;

      // Skip natively interactive elements and elements with interactive roles —
      // axe-core already handles missing names on those.
      if (isNativeInteractive || hasInteractiveRole) {
        continue;
      }

      // Detect if this element appears interactive
      const appearsInteractive = this.appearsInteractive(el);
      if (!appearsInteractive) {
        continue;
      }

      const selector = this.getSelector(el);
      const accessibleName = this.getAccessibleName(el);
      const hasKeyboardSupport = el.hasAttribute('tabindex');

      // Check 1: Non-interactive element acts as interactive without a role
      if (!role) {
        issues.push({
          id: `interactive-no-role-${idx++}`,
          category: 'interactive',
          element: el,
          selector,
          impact: 'serious',
          message: `Element <${el.tagName.toLowerCase()}> appears interactive (has click handler or cursor:pointer) but has no ARIA role. Add role="button" or use a native <button> element.`,
          wcagTags: ['wcag412', 'wcag211']
        });
      }

      // Check 2: Interactive-looking element without an accessible name
      if (!accessibleName) {
        issues.push({
          id: `interactive-no-name-${idx++}`,
          category: 'interactive',
          element: el,
          selector,
          impact: 'serious',
          message: `Element <${el.tagName.toLowerCase()}> appears interactive but has no accessible name. Add aria-label, aria-labelledby, or visible text content.`,
          wcagTags: ['wcag412']
        });
      }

      // Check 3: Interactive element without keyboard support
      if (!hasKeyboardSupport) {
        issues.push({
          id: `interactive-no-keyboard-${idx++}`,
          category: 'interactive',
          element: el,
          selector,
          impact: 'critical',
          message: `Element <${el.tagName.toLowerCase()}> appears interactive but cannot be reached by keyboard. Add tabindex="0" and keydown handlers, or use a native <button> element.`,
          wcagTags: ['wcag211']
        });
      }
    }

    return issues;
  }

  private appearsInteractive(el: HTMLElement): boolean {
    // 1. Check for Angular event bindings — Angular adds __ngContext__ and
    //    registers event listeners. We detect them via the presence of
    //    (click) in the original template by checking common Angular-compiled markers.

    // Check for explicit onclick attribute
    if (el.hasAttribute('onclick')) {
      return true;
    }

    // 2. Check computed cursor — a strong signal of interactivity
    try {
      const style = getComputedStyle(el);
      if (style.cursor === 'pointer') {
        return true;
      }
    } catch {
      // getComputedStyle may fail for disconnected elements
    }

    // 3. Check for Angular event binding markers
    // Angular adds attributes like `_ngcontent-*` and event listeners are not
    // visible as attributes. However, we can check for __ng_listeners or
    // the presence of event-related attributes that Angular libraries set.

    // Check if the element has ng-reflect-* attributes (debug mode only)
    const attrs = el.attributes;
    for (let i = 0; i < attrs.length; i++) {
      const name = attrs[i].name;
      if (name.startsWith('ng-reflect-') && name.includes('click')) {
        return true;
      }
    }

    return false;
  }

  private getAccessibleName(el: HTMLElement): string {
    // Check aria-label
    const ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel?.trim()) return ariaLabel.trim();

    // Check aria-labelledby
    const labelledBy = el.getAttribute('aria-labelledby');
    if (labelledBy) {
      const labelEl = el.ownerDocument.getElementById(labelledBy);
      if (labelEl?.textContent?.trim()) return labelEl.textContent.trim();
    }

    // Check title
    const title = el.getAttribute('title');
    if (title?.trim()) return title.trim();

    // Check visible text content (excluding hidden children)
    const text = el.textContent?.trim();
    if (text) return text;

    // Check for img alt inside
    const img = el.querySelector('img[alt]');
    if (img?.getAttribute('alt')?.trim()) {
      return img.getAttribute('alt')!.trim();
    }

    return '';
  }

  private getSelector(el: HTMLElement): string {
    const tag = el.tagName.toLowerCase();
    if (el.id) return `${tag}#${el.id}`;
    const classes = Array.from(el.classList).slice(0, 2).join('.');
    return classes ? `${tag}.${classes}` : tag;
  }
}
