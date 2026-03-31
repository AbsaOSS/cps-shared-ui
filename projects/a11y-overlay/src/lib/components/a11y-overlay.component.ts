import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
  signal,
  effect,
  OnInit,
  ElementRef,
  viewChild,
} from '@angular/core';
import { A11yOverlayService } from '../services/a11y-overlay.service';
import { InlineHighlightComponent } from './inline-highlight/inline-highlight.component';
import { FocusBadgeComponent, FocusBadgeData } from './focus-badge/focus-badge.component';
import { HeadingBadgeComponent, HeadingBadgeData } from './heading-badge/heading-badge.component';

import { LandmarkOverlayComponent, LandmarkData } from './landmark-overlay/landmark-overlay.component';
import { IssuePanelComponent } from './issue-panel/issue-panel.component';
import { ElementHighlight, worstImpact, A11yIssue } from '../models/a11y-issue.model';
import { getElementKey } from '../utils/dom-position';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]',
  '[contenteditable="true"]',
].join(',');



@Component({
  selector: 'a11y-overlay',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    InlineHighlightComponent,
    FocusBadgeComponent,
    HeadingBadgeComponent,
    LandmarkOverlayComponent,
    IssuePanelComponent,
  ],
  template: `
    @if (service.isActive()) {
      <div class="a11y-overlay-container">
        @if (showHighlights()) {
          @for (highlight of elementHighlights(); track highlight.primary.id) {
            <a11y-inline-highlight [highlight]="highlight" />
          }
        }

        @if (showFocusOrder()) {
          @for (badge of focusBadges(); track badge.index) {
            <a11y-focus-badge [data]="badge" />
          }
        }

        @if (showHeadings()) {
          @for (badge of headingBadges(); track $index) {
            <a11y-heading-badge [data]="badge" />
          }
        }

        @if (showLandmarks()) {
          @for (lm of landmarks(); track lm.label) {
            <a11y-landmark-overlay [data]="lm" />
          }
        }

        <a11y-issue-panel />
      </div>

      @if (service.hoveredHighlight(); as hovered) {
        <div
          class="a11y-floating-tooltip"
          #tooltipEl
          [style.top.px]="adjustedTooltipPosition().top"
          [style.left.px]="adjustedTooltipPosition().left"
          (mouseenter)="keepTooltip()"
          (mouseleave)="dismissTooltip()"
          role="tooltip">
          @for (issue of hovered.highlight.issues; track issue.id) {
            <div class="a11y-floating-tooltip__issue" [class.a11y-floating-tooltip__issue--divider]="!$first">
              <span class="a11y-floating-tooltip__impact" [class]="'a11y-floating-tooltip__impact--' + issue.impact">
                {{ issue.impact }}
              </span>
              <span class="a11y-floating-tooltip__message">{{ issue.message }}</span>
              @if (issue.helpUrl) {
                <a
                  class="a11y-floating-tooltip__link"
                  [href]="issue.helpUrl"
                  target="_blank"
                  rel="noopener noreferrer">
                  Learn more
                </a>
              }
              @if (issue.wcagTags?.length) {
                <div class="a11y-floating-tooltip__tags">
                  @for (tag of issue.wcagTags; track tag) {
                    <span class="a11y-floating-tooltip__tag">{{ tag }}</span>
                  }
                </div>
              }
            </div>
          }
        </div>
      }
    }
  `,
  styles: `
    .a11y-overlay-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 0;
      height: 0;
      overflow: visible;
      pointer-events: none;
      z-index: 2147483640;
    }

    .a11y-floating-tooltip {
      position: fixed;
      min-width: 280px;
      max-width: 420px;
      padding: 10px 12px;
      background: #1e1e1e;
      color: #f5f5f5;
      border-radius: 6px;
      font: 13px/1.4 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      z-index: 2147483647;
      pointer-events: auto;
      word-break: break-word;
    }

    .a11y-floating-tooltip__impact {
      display: inline-block;
      padding: 1px 6px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      margin-right: 6px;
    }
    .a11y-floating-tooltip__impact--critical { background: #d32f2f; color: #fff; }
    .a11y-floating-tooltip__impact--serious { background: #f57c00; color: #fff; }
    .a11y-floating-tooltip__impact--moderate { background: #fbc02d; color: #1e1e1e; }
    .a11y-floating-tooltip__impact--minor { background: #1976d2; color: #fff; }

    .a11y-floating-tooltip__message {
      display: inline;
    }

    .a11y-floating-tooltip__issue--divider {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #444;
    }

    .a11y-floating-tooltip__link {
      display: block;
      margin-top: 6px;
      color: #90caf9;
      text-decoration: underline;
      font-size: 12px;
    }

    .a11y-floating-tooltip__tags {
      margin-top: 6px;
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .a11y-floating-tooltip__tag {
      display: inline-block;
      padding: 1px 5px;
      background: #333;
      border-radius: 3px;
      font-size: 10px;
      color: #bbb;
    }
  `,
})
export class A11yOverlayComponent implements OnInit {
  protected readonly service = inject(A11yOverlayService);

  private readonly tooltipRef = viewChild<ElementRef<HTMLElement>>('tooltipEl');
  private readonly tooltipMeasured = signal<{ width: number; height: number } | null>(null);

  readonly initialTooltipPosition = computed(() => {
    const hovered = this.service.hoveredHighlight();
    if (!hovered) return { top: 0, left: 0 };
    const { anchorRect } = hovered;
    // Place near the anchor; adjustment will refine
    return { top: anchorRect.bottom + 4, left: anchorRect.left };
  });

  readonly adjustedTooltipPosition = computed(() => {
    const initial = this.initialTooltipPosition();
    const measured = this.tooltipMeasured();
    const hovered = this.service.hoveredHighlight();
    if (!measured || !hovered) return initial;

    const { anchorRect } = hovered;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const m = 8;
    const gap = 6;
    const tw = measured.width;
    const th = measured.height;
    const aCx = anchorRect.left + anchorRect.width / 2;
    const aCy = anchorRect.top + anchorRect.height / 2;

    // Check if tooltip would cover the anchor dot
    const coversAnchor = (t: number, l: number) =>
      l < anchorRect.right + 2 && l + tw > anchorRect.left - 2 &&
      t < anchorRect.bottom + 2 && t + th > anchorRect.top - 2;

    // Try positions near the anchor dot: above, below, right, left
    const candidates: { top: number; left: number }[] = [
      { top: anchorRect.top - th - gap, left: aCx - tw / 2 },
      { top: anchorRect.bottom + gap, left: aCx - tw / 2 },
      { top: aCy - th / 2, left: anchorRect.right + gap },
      { top: aCy - th / 2, left: anchorRect.left - tw - gap },
    ];

    // First pass: find a candidate that fits in viewport and doesn't cover the dot
    for (const c of candidates) {
      const cl = Math.max(m, Math.min(c.left, vw - tw - m));
      const ct = Math.max(m, Math.min(c.top, vh - th - m));
      if (!coversAnchor(ct, cl)) {
        return { top: ct, left: cl };
      }
    }

    // Fallback: above anchor, clamped to viewport (acceptable to overlap)
    return {
      top: Math.max(m, Math.min(anchorRect.top - th - gap, vh - th - m)),
      left: Math.max(m, Math.min(aCx - tw / 2, vw - tw - m)),
    };
  });

  private readonly measureTooltipEffect = effect(() => {
    const hovered = this.service.hoveredHighlight();
    if (!hovered) {
      this.tooltipMeasured.set(null);
      return;
    }
    // Read initial position to establish signal dependency
    this.initialTooltipPosition();
    // Measure after render
    requestAnimationFrame(() => {
      const el = this.tooltipRef()?.nativeElement;
      if (el) {
        this.tooltipMeasured.set({ width: el.offsetWidth, height: el.offsetHeight });
      }
    });
  });

  keepTooltip(): void {
    this.service.cancelTooltipDismiss();
  }

  dismissTooltip(): void {
    this.service.scheduleTooltipDismiss(
      this.service.hoveredHighlight()?.highlight.primary.id ?? ''
    );
  }

  readonly showHighlights = computed(() => {
    const cats = this.service.activeCategories();
    return cats.has('axe') || cats.has('link-text') || cats.has('focus-order')
      || cats.has('landmarks') || cats.has('headings') || cats.has('interactive');
  });

  /** All inline highlights. Focus-order issues render as "ghost" (invisible unless selected). */
  readonly highlightIssues = computed(() => this.service.filteredIssues());

  /** One highlight per DOM element, using the most severe impact. */
  readonly elementHighlights = computed<ElementHighlight[]>(() => {
    const issues = this.highlightIssues();
    const byKey = new Map<string, A11yIssue[]>();
    for (const issue of issues) {
      const key = getElementKey(issue.element);
      const group = byKey.get(key);
      if (group) {
        group.push(issue);
      } else {
        byKey.set(key, [issue]);
      }
    }
    return Array.from(byKey.values()).map((group) => {
      const impact = worstImpact(group.map((i) => i.impact));
      const primary = group.find((i) => i.impact === impact) ?? group[0];
      return { element: primary.element, impact, issues: group, primary };
    });
  });

  readonly showFocusOrder = computed(() =>
    this.service.activeCategories().has('focus-order')
  );

  readonly showHeadings = computed(() =>
    this.service.activeCategories().has('headings')
  );

  readonly showLandmarks = computed(() =>
    this.service.showLandmarkOverlay()
  );

  readonly landmarks = computed<LandmarkData[]>(() => {
    this.service.issues();
    this.service.domChangeTick();
    if (!this.showLandmarks()) return [];
    return this.computeLandmarks();
  });


  readonly focusBadges = computed<FocusBadgeData[]>(() => {
    // Re-evaluate when issues change (scan happened) or DOM changes
    this.service.issues();
    this.service.domChangeTick();
    if (!this.showFocusOrder()) return [];
    return this.computeFocusBadges();
  });

  readonly headingBadges = computed<HeadingBadgeData[]>(() => {
    this.service.issues();
    this.service.domChangeTick();
    if (!this.showHeadings()) return [];
    return this.computeHeadingBadges();
  });

  ngOnInit(): void {
    this.service.initialize();
  }

  private computeFocusBadges(): FocusBadgeData[] {
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    ).filter((el) => {
      if (el.closest('a11y-overlay')) return false;
      const style = getComputedStyle(el);
      return (
        el.tabIndex >= 0 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden'
      );
    });

    return elements.map((el, i) => ({
      element: el,
      index: i,
      tabIndex: el.tabIndex,
      hasStaticError: el.tabIndex > 0, // only static errors; off-screen is computed dynamically by the badge
    }));
  }

  private computeHeadingBadges(): HeadingBadgeData[] {
    const headings = Array.from(
      document.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6')
    ).filter((el) => !el.closest('a11y-overlay'));
    const errorIds = new Set(
      this.service
        .issues()
        .filter((i) => i.category === 'headings')
        .map((i) => i.element)
    );

    return headings.map((el) => ({
      element: el,
      level: parseInt(el.tagName[1], 10),
      hasError: errorIds.has(el),
    }));
  }

  private computeLandmarks(): LandmarkData[] {
    const LANDMARK_MAP: Record<string, string> = {
      banner: 'header',
      navigation: 'nav',
      main: 'main',
      complementary: 'aside',
      contentinfo: 'footer',
      search: 'search',
      form: 'form',
      region: 'section',
    };

    const results: LandmarkData[] = [];

    // Find elements by semantic tags
    const tagMap: Record<string, string> = {
      HEADER: 'banner',
      NAV: 'navigation',
      MAIN: 'main',
      ASIDE: 'complementary',
      FOOTER: 'contentinfo',
      SEARCH: 'search',
      SECTION: 'region',
      FORM: 'form',
    };

    for (const [tag, role] of Object.entries(tagMap)) {
      document.querySelectorAll<HTMLElement>(tag).forEach((el) => {
        if (el.closest('a11y-overlay')) return;
        const name =
          el.getAttribute('aria-label') ||
          this.getLabelledByText(el) ||
          '';
        results.push({
          element: el,
          role,
          label: name ? `${role}: ${name}` : role,
        });
      });
    }

    // Find elements by explicit role attribute
    for (const role of Object.keys(LANDMARK_MAP)) {
      document
        .querySelectorAll<HTMLElement>(`[role="${role}"]`)
        .forEach((el) => {
          if (el.closest('a11y-overlay')) return;
          // Skip if already added via tag
          if (results.some((r) => r.element === el)) return;
          const name =
            el.getAttribute('aria-label') ||
            this.getLabelledByText(el) ||
            '';
          results.push({
            element: el,
            role,
            label: name ? `${role}: ${name}` : role,
          });
        });
    }

    return results;
  }

  private getLabelledByText(el: HTMLElement): string {
    const id = el.getAttribute('aria-labelledby');
    if (!id) return '';
    const labelEl = document.getElementById(id);
    return labelEl?.textContent?.trim() ?? '';
  }

}
