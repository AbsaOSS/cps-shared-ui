import { Injectable } from '@angular/core';
import { A11yIssue } from '../models/a11y-issue.model';
import { Scanner } from './scanner.interface';

@Injectable()
export class HeadingScanner implements Scanner {
  async scan(root: HTMLElement): Promise<A11yIssue[]> {
    const issues: A11yIssue[] = [];
    const headings = Array.from(
      root.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6')
    ).filter((el) => !el.closest('a11y-overlay'));

    // Check for multiple h1s
    const h1s = headings.filter(
      (h) => h.tagName.toLowerCase() === 'h1'
    );
    if (h1s.length > 1) {
      h1s.forEach((el, i) => {
        issues.push({
          id: `heading-multiple-h1-${i}`,
          category: 'headings',
          element: el,
          selector: this.getSelector(el),
          impact: 'moderate',
          message: `Multiple <h1> elements found (${h1s.length}). Pages should generally have a single <h1>.`,
        });
      });
    }

    // Check for missing h1
    if (h1s.length === 0 && headings.length > 0) {
      const first = headings[0];
      issues.push({
        id: 'heading-missing-h1',
        category: 'headings',
        element: first,
        selector: this.getSelector(first),
        impact: 'moderate',
        message:
          'No <h1> element found. Pages should have a top-level heading.',
      });
    }

    // Check for skipped levels
    let lastLevel = 0;
    headings.forEach((el, index) => {
      const level = parseInt(el.tagName[1], 10);
      if (lastLevel > 0 && level > lastLevel + 1) {
        issues.push({
          id: `heading-skipped-${index}`,
          category: 'headings',
          element: el,
          selector: this.getSelector(el),
          impact: 'moderate',
          message: `Heading level skipped: <h${lastLevel}> to <h${level}>. Headings should not skip levels.`,
        });
      }
      lastLevel = level;
    });

    // Check for empty headings
    headings.forEach((el, index) => {
      const text = (el.textContent || '').trim();
      if (!text) {
        issues.push({
          id: `heading-empty-${index}`,
          category: 'headings',
          element: el,
          selector: this.getSelector(el),
          impact: 'serious',
          message: `Empty <${el.tagName.toLowerCase()}> element. Headings must have accessible text content.`,
        });
      }
    });

    return issues;
  }

  private getSelector(el: HTMLElement): string {
    if (el.id) return `#${el.id}`;
    const tag = el.tagName.toLowerCase();
    const classes = Array.from(el.classList).join('.');
    return classes ? `${tag}.${classes}` : tag;
  }
}
