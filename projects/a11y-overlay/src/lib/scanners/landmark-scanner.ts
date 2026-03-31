import { Injectable } from '@angular/core';
import { A11yIssue } from '../models/a11y-issue.model';
import { Scanner } from './scanner.interface';

const LANDMARK_SELECTORS: Record<string, string> = {
  banner: 'header, [role="banner"]',
  navigation: 'nav, [role="navigation"]',
  main: 'main, [role="main"]',
  contentinfo: 'footer, [role="contentinfo"]',
  complementary: 'aside, [role="complementary"]',
  region: 'section[aria-label], section[aria-labelledby], [role="region"][aria-label], [role="region"][aria-labelledby]',
  search: '[role="search"]',
  form: 'form[aria-label], form[aria-labelledby], [role="form"]',
};

@Injectable()
export class LandmarkScanner implements Scanner {
  async scan(root: HTMLElement): Promise<A11yIssue[]> {
    const issues: A11yIssue[] = [];

    // Check for missing main landmark
    const allMains = root.querySelectorAll<HTMLElement>(
      LANDMARK_SELECTORS['main']
    );
    const mains = Array.from(allMains).filter((el) => !el.closest('a11y-overlay'));
    if (mains.length === 0) {
      issues.push({
        id: 'landmark-missing-main',
        category: 'landmarks',
        element: root,
        selector: 'body',
        impact: 'serious',
        message:
          'No <main> or [role="main"] landmark found. Pages should have a main landmark.',
      });
    }

    // Check for duplicate single-instance landmarks
    const singleInstance = ['banner', 'contentinfo', 'main'] as const;
    for (const role of singleInstance) {
      const allElements = root.querySelectorAll<HTMLElement>(
        LANDMARK_SELECTORS[role]
      );
      const elements = Array.from(allElements).filter((el) => !el.closest('a11y-overlay'));
      if (elements.length > 1) {
        elements.forEach((el, i) => {
          issues.push({
            id: `landmark-duplicate-${role}-${i}`,
            category: 'landmarks',
            element: el,
            selector: this.getSelector(el),
            impact: 'moderate',
            message: `Multiple "${role}" landmarks found (${elements.length}). There should be only one per page, or provide unique aria-labels.`,
          });
        });
      }
    }

    // Check for navigation landmarks without accessible names when there are multiple
    const allNavs = root.querySelectorAll<HTMLElement>(
      LANDMARK_SELECTORS['navigation']
    );
    const navs = Array.from(allNavs).filter((el) => !el.closest('a11y-overlay'));
    if (navs.length > 1) {
      navs.forEach((nav, i) => {
        if (
          !nav.getAttribute('aria-label') &&
          !nav.getAttribute('aria-labelledby')
        ) {
          issues.push({
            id: `landmark-nav-unnamed-${i}`,
            category: 'landmarks',
            element: nav,
            selector: this.getSelector(nav),
            impact: 'moderate',
            message:
              'Multiple navigation landmarks found. Each should have a unique aria-label to distinguish them.',
          });
        }
      });
    }

    return issues;
  }

  private getSelector(el: HTMLElement): string {
    if (el.id) return `#${el.id}`;
    const tag = el.tagName.toLowerCase();
    const role = el.getAttribute('role');
    if (role) return `${tag}[role="${role}"]`;
    return tag;
  }
}
