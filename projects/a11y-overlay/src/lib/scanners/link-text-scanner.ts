import { Injectable } from '@angular/core';
import { A11yIssue } from '../models/a11y-issue.model';
import { Scanner } from './scanner.interface';

const GENERIC_LINK_PATTERNS = [
  /^click\s*here$/i,
  /^here$/i,
  /^read\s*more$/i,
  /^more$/i,
  /^learn\s*more$/i,
  /^link$/i,
  /^this$/i,
  /^info$/i,
  /^details$/i,
];

@Injectable()
export class LinkTextScanner implements Scanner {
  async scan(root: HTMLElement): Promise<A11yIssue[]> {
    const issues: A11yIssue[] = [];
    const links = Array.from(
      root.querySelectorAll<HTMLElement>('a[href], [role="link"]')
    ).filter((el) => !el.closest('a11y-overlay'));
    const buttons = Array.from(
      root.querySelectorAll<HTMLElement>(
        'button, [role="button"], input[type="button"], input[type="submit"]'
      )
    ).filter((el) => !el.closest('a11y-overlay'));

    const checkElement = (el: HTMLElement, type: string, index: number) => {
      const text = this.getAccessibleName(el).trim();

      if (!text) {
        issues.push({
          id: `linktext-empty-${type}-${index}`,
          category: 'link-text',
          element: el,
          selector: this.getSelector(el),
          impact: 'critical',
          message: `${type === 'link' ? 'Link' : 'Button'} has no accessible name. Add text content, aria-label, or aria-labelledby.`,
        });
        return;
      }

      if (GENERIC_LINK_PATTERNS.some((p) => p.test(text))) {
        issues.push({
          id: `linktext-generic-${type}-${index}`,
          category: 'link-text',
          element: el,
          selector: this.getSelector(el),
          impact: 'moderate',
          message: `${type === 'link' ? 'Link' : 'Button'} has generic text "${text}". Use descriptive text that explains the purpose.`,
        });
      }
    };

    links.forEach((el, i) => checkElement(el, 'link', i));
    buttons.forEach((el, i) => checkElement(el, 'button', i));

    return issues;
  }

  private getAccessibleName(el: HTMLElement): string {
    // aria-labelledby takes precedence
    const labelledById = el.getAttribute('aria-labelledby');
    if (labelledById) {
      const labels = labelledById
        .split(/\s+/)
        .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
        .filter(Boolean);
      if (labels.length > 0) return labels.join(' ');
    }

    // Then aria-label
    const ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    // Then title
    const title = el.getAttribute('title');
    if (title) return title;

    // Then text content
    return el.textContent?.trim() ?? '';
  }

  private getSelector(el: HTMLElement): string {
    if (el.id) return `#${el.id}`;
    const tag = el.tagName.toLowerCase();
    const classes = Array.from(el.classList).join('.');
    return classes ? `${tag}.${classes}` : tag;
  }
}
