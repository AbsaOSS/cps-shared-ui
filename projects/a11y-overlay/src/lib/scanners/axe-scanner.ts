import { Injectable, inject } from '@angular/core';
import type { RunOptions, AxeResults, Result, NodeResult } from 'axe-core';
import { A11yIssue, A11yImpact, A11yCategory } from '../models/a11y-issue.model';
import { A11Y_OVERLAY_CONFIG } from '../models/a11y-config.model';
import { Scanner } from './scanner.interface';

/**
 * Maps axe-core rule IDs to their semantic category.
 * Rules not listed here default to 'axe'.
 */
const AXE_RULE_CATEGORY_MAP: Record<string, A11yCategory> = {
  // Landmark rules → 'landmarks'
  'region': 'landmarks',
  'landmark-one-main': 'landmarks',
  'landmark-no-duplicate-banner': 'landmarks',
  'landmark-no-duplicate-contentinfo': 'landmarks',
  'landmark-no-duplicate-main': 'landmarks',
  'landmark-main-is-top-level': 'landmarks',
  'landmark-banner-is-top-level': 'landmarks',
  'landmark-contentinfo-is-top-level': 'landmarks',
  'landmark-complementary-is-top-level': 'landmarks',
  'landmark-unique': 'landmarks',
  // Heading rules → 'headings'
  'heading-order': 'headings',
  'page-has-heading-one': 'headings',
  'empty-heading': 'headings',
  // Link/button text rules → 'link-text'
  'link-name': 'link-text',
  'button-name': 'link-text',
  'link-in-text-block': 'link-text',
  'input-button-name': 'link-text',
};

@Injectable()
export class AxeScanner implements Scanner {
  private readonly config = inject(A11Y_OVERLAY_CONFIG, { optional: true });

  async scan(root: HTMLElement): Promise<A11yIssue[]> {
    const axe = await import('axe-core');
    const options: RunOptions = {
      resultTypes: ['violations', 'incomplete'],
      ...this.config?.axeOptions,
    };

    // Exclude the overlay's own DOM from scanning.
    // `exclude` is part of the context (1st arg), not options (2nd arg).
    const context = {
      include: [root] as any,
      exclude: ['a11y-overlay'] as any,
    };

    let results: AxeResults;
    try {
      results = await axe.default.run(context as any, options);
    } catch {
      return [];
    }

    const issues: A11yIssue[] = [];

    // Process definite violations
    for (const violation of results.violations) {
      for (const node of violation.nodes) {
        if (violation.id === 'color-contrast') {
          const contrastIssue = this.mapContrastIssue(violation, node, root);
          if (contrastIssue) {
            issues.push(contrastIssue);
          }
        } else {
          issues.push(this.mapToIssue(violation, node, root, false));
        }
      }
    }

    // Process incomplete results — only for color-contrast.
    // axe puts color-contrast in 'incomplete' when it can't fully determine
    // the background (images, gradients, opacity layers). We compute contrast
    // ourselves and only report actual failures.
    // All other incomplete rules are skipped — they produce false positives
    // (e.g., empty-table-header on <th> elements that clearly have text).
    for (const incomplete of results.incomplete ?? []) {
      if (incomplete.id !== 'color-contrast') continue;
      for (const node of incomplete.nodes) {
        const contrastIssue = this.mapContrastIssue(incomplete, node, root);
        if (contrastIssue) {
          issues.push(contrastIssue);
        }
      }
    }

    return issues;
  }

  private mapToIssue(
    violation: Result,
    node: NodeResult,
    root: HTMLElement,
    isIncomplete: boolean
  ): A11yIssue {
    // Try each target selector; axe may provide multiple for shadow DOM paths
    let element: HTMLElement | null = null;
    for (const selector of node.target) {
      if (typeof selector === 'string') {
        try {
          element = root.querySelector<HTMLElement>(selector);
        } catch {
          // Invalid selector — skip
        }
        if (element) break;
      }
    }
    // Fallback: try the joined selector
    if (!element) {
      try {
        element = root.querySelector<HTMLElement>(node.target.join(' '));
      } catch {
        // Invalid selector
      }
    }

    const prefix = isIncomplete ? '⚠ Needs review: ' : '';
    const category = AXE_RULE_CATEGORY_MAP[violation.id] ?? 'axe';

    return {
      id: `axe-${violation.id}-${isIncomplete ? 'inc-' : ''}${node.target.join(',')}`,
      category,
      element: element ?? root,
      selector: node.target.join(' '),
      impact: (node.impact as A11yImpact) ?? 'minor',
      message: `${prefix}${violation.help} (${violation.id})`,
      helpUrl: violation.helpUrl,
      wcagTags: violation.tags.filter(
        (t) => t.startsWith('wcag') || t.startsWith('best-practice')
      ),
    };
  }

  /**
   * For color-contrast results, extract or compute the actual contrast data
   * and only report if the ratio fails WCAG AA thresholds.
   * Works for both violations (axe has data) and incomplete (we compute).
   */
  private mapContrastIssue(
    rule: Result,
    node: NodeResult,
    root: HTMLElement
  ): A11yIssue | null {
    const element = this.resolveElement(node, root);
    if (!element) {
      return null;
    }

    // Try axe's own data first (reliable for violations)
    const checkData = node.any?.[0]?.data ?? node.all?.[0]?.data;
    let fgColor: string | undefined;
    let bgColor: string | undefined;
    let contrastRatio: number | undefined;
    let threshold = 4.5;

    if (checkData) {
      const data = checkData as Record<string, unknown>;
      fgColor = data['fgColor'] as string | undefined;
      bgColor = data['bgColor'] as string | undefined;
      contrastRatio = data['contrastRatio'] as number | undefined;

      if (data['expectedContrastRatio']) {
        const parsed = parseFloat(String(data['expectedContrastRatio']));
        if (!isNaN(parsed)) threshold = parsed;
      }
    }

    // If axe didn't provide a valid ratio (incomplete results), compute it
    if (!contrastRatio || contrastRatio <= 0) {
      const computed = this.computeContrast(element);
      if (!computed) return null;
      contrastRatio = computed.ratio;
      fgColor = computed.fg;
      bgColor = computed.bg;
    }

    // Determine threshold from computed styles if not from axe
    const style = window.getComputedStyle(element);
    const fontSize = parseFloat(style.fontSize);
    const fontWeight = parseInt(style.fontWeight, 10) || 400;
    const isLargeText =
      fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
    if (isLargeText) threshold = 3;

    // Only report if contrast actually fails
    if (contrastRatio >= threshold) {
      return null;
    }

    const ratio = contrastRatio.toFixed(2);
    const details = [
      `Contrast ratio: ${ratio}:1 (required: ${threshold}:1)`,
      fgColor ? `Foreground: ${fgColor}` : null,
      bgColor ? `Background: ${bgColor}` : null,
    ]
      .filter(Boolean)
      .join(' · ');

    return {
      id: `axe-color-contrast-${node.target.join(',')}`,
      category: AXE_RULE_CATEGORY_MAP[rule.id] ?? 'axe',
      element,
      selector: node.target.join(' '),
      impact: contrastRatio < threshold * 0.67 ? 'critical' : 'serious',
      message: `Insufficient color contrast: ${details}`,
      helpUrl: rule.helpUrl,
      wcagTags: rule.tags.filter(
        (t) => t.startsWith('wcag') || t.startsWith('best-practice')
      ),
    };
  }

  /**
   * Compute contrast ratio from computed styles when axe can't determine it.
   */
  private computeContrast(
    element: HTMLElement
  ): { ratio: number; fg: string; bg: string } | null {
    try {
      const style = window.getComputedStyle(element);
      const fgRgb = this.parseColor(style.color);
      if (!fgRgb) return null;

      const bgRgb = this.getEffectiveBackground(element);
      if (!bgRgb) return null;

      const fgLum = this.relativeLuminance(fgRgb);
      const bgLum = this.relativeLuminance(bgRgb);
      const lighter = Math.max(fgLum, bgLum);
      const darker = Math.min(fgLum, bgLum);
      const ratio = (lighter + 0.05) / (darker + 0.05);

      return {
        ratio: Math.round(ratio * 100) / 100,
        fg: `rgb(${fgRgb.join(', ')})`,
        bg: `rgb(${bgRgb.join(', ')})`,
      };
    } catch {
      return null;
    }
  }

  private getEffectiveBackground(el: HTMLElement): number[] | null {
    let current: HTMLElement | null = el;
    const layers: number[][] = [];

    while (current) {
      const style = window.getComputedStyle(current);
      const rgba = this.parseColor(style.backgroundColor);
      if (rgba) {
        const alpha = rgba[3] ?? 1;
        if (alpha > 0) {
          layers.unshift(rgba);
        }
        if (alpha === 1) break; // Fully opaque — no need to go further
      }
      current = current.parentElement;
    }

    if (layers.length === 0) return [255, 255, 255]; // Default white

    // Composite layers bottom-to-top
    let result = layers[0].slice(0, 3);
    for (let i = 1; i < layers.length; i++) {
      const layer = layers[i];
      const alpha = layer[3] ?? 1;
      result = [
        Math.round(result[0] * (1 - alpha) + layer[0] * alpha),
        Math.round(result[1] * (1 - alpha) + layer[1] * alpha),
        Math.round(result[2] * (1 - alpha) + layer[2] * alpha),
      ];
    }
    return result;
  }

  private parseColor(color: string): number[] | null {
    const rgba = color.match(
      /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/
    );
    if (!rgba) return null;
    return [
      parseInt(rgba[1], 10),
      parseInt(rgba[2], 10),
      parseInt(rgba[3], 10),
      rgba[4] != null ? parseFloat(rgba[4]) : 1,
    ];
  }

  private relativeLuminance(rgb: number[]): number {
    const [r, g, b] = rgb.map((c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  private resolveElement(
    node: NodeResult,
    root: HTMLElement
  ): HTMLElement | null {
    for (const selector of node.target) {
      if (typeof selector === 'string') {
        try {
          const el = root.querySelector<HTMLElement>(selector);
          if (el) return el;
        } catch {
          // Invalid selector
        }
      }
    }
    try {
      return root.querySelector<HTMLElement>(node.target.join(' '));
    } catch {
      return null;
    }
  }
}
