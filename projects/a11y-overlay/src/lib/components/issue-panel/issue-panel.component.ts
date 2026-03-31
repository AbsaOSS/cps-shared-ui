import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  effect,
  ElementRef,
} from '@angular/core';
import { A11yOverlayService } from '../../services/a11y-overlay.service';
import { A11yIssue, A11yCategory, A11yImpact } from '../../models/a11y-issue.model';
import { isElementOffScreen } from '../../utils/dom-position';

const IMPACT_ORDER: A11yImpact[] = ['critical', 'serious', 'moderate', 'minor'];

const CATEGORY_LABELS: Record<A11yCategory, string> = {
  axe: 'Axe Rules',
  'focus-order': 'Focus Order',
  headings: 'Headings',
  landmarks: 'Page Structure',
  'link-text': 'Link & Button Text',
  'interactive': 'Interactive Elements',
};

const CATEGORY_ICONS: Record<A11yCategory, string> = {
  axe: '🔍',
  'focus-order': '⇥',
  headings: 'H',
  landmarks: '◈',
  'link-text': '🔗',
  'interactive': '☞',
};

interface IssueGroup {
  category: A11yCategory;
  label: string;
  icon: string;
  issues: A11yIssue[];
  criticalCount: number;
  seriousCount: number;
  moderateCount: number;
  minorCount: number;
}

function describeElement(issue: A11yIssue): string {
  const el = issue.element;
  if (!el || el === document.body || el === document.documentElement) {
    return 'Page-level issue';
  }

  const tag = el.tagName.toLowerCase();
  const id = el.id ? `#${el.id}` : '';
  const ariaLabel = el.getAttribute('aria-label');
  const role = el.getAttribute('role');
  const textContent = el.textContent?.trim() ?? '';
  const textSnippet = textContent.length > 30 ? textContent.substring(0, 30) + '…' : textContent;

  const parts: string[] = [`<${tag}${id}>`];

  if (role) {
    parts.push(`[${role}]`);
  }

  if (ariaLabel) {
    parts.push(`"${ariaLabel.length > 30 ? ariaLabel.substring(0, 30) + '…' : ariaLabel}"`);
  } else if (textSnippet && textSnippet.length > 0) {
    parts.push(`"${textSnippet}"`);
  }

  return parts.join(' ');
}

@Component({
  selector: 'a11y-issue-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="a11y-panel"
      [class.a11y-panel--open]="isOpen()"
      role="complementary"
      aria-label="Accessibility issues panel">

      <button
        class="a11y-panel__toggle"
        (click)="togglePanel()"
        [attr.aria-expanded]="isOpen()"
        aria-controls="a11y-panel-content"
        type="button">
        @if (isOpen()) {
          <span aria-hidden="true">&#x2715;</span>
          <span class="a11y-sr-only">Close accessibility panel</span>
        } @else {
          <svg class="a11y-panel__toggle-icon" aria-hidden="true" viewBox="64 64 384 384">
            <path fill="currentColor" d="M256 108c19.882 0 36 16.118 36 36s-16.118 36-36 36-36-16.118-36-36 16.118-36 36-36zm117.741 98.023c-28.712 6.779-55.511 12.748-82.14 15.807.851 101.023 12.306 123.052 25.037 155.621 3.617 9.26-.957 19.698-10.217 23.315-9.261 3.617-19.699-.957-23.316-10.217-8.705-22.308-17.086-40.636-22.261-78.549h-9.686c-5.167 37.851-13.534 56.208-22.262 78.549-3.615 9.255-14.05 13.836-23.315 10.217-9.26-3.617-13.834-14.056-10.217-23.315 12.713-32.541 24.185-54.541 25.037-155.621-26.629-3.058-53.428-9.027-82.141-15.807-8.6-2.031-13.926-10.648-11.895-19.249s10.647-13.926 19.249-11.895c96.686 22.829 124.283 22.783 220.775 0 8.599-2.03 17.218 3.294 19.249 11.895 2.029 8.601-3.297 17.219-11.897 19.249z"/>
          </svg>
          <span class="a11y-panel__badge" [class]="badgeClass()">{{ service.totalIssueCount() }}</span>
          <span class="a11y-sr-only">Open accessibility panel ({{ service.totalIssueCount() }} issues)</span>
        }
      </button>

      @if (isOpen()) {
        <div class="a11y-panel__content" id="a11y-panel-content">
          <div class="a11y-panel__header">
            <h2 class="a11y-panel__title">A11y Issues</h2>
            <div class="a11y-panel__counts">
              @for (impact of impactOrder; track impact) {
                <button
                  type="button"
                  class="a11y-panel__count"
                  [class]="'a11y-panel__count--' + impact"
                  [class.a11y-panel__count--inactive]="!activeImpacts().has(impact)"
                  (click)="toggleImpact(impact)"
                  [attr.aria-pressed]="activeImpacts().has(impact)"
                  [attr.aria-label]="(activeImpacts().has(impact) ? 'Hide' : 'Show') + ' ' + impact + ' issues'">
                  {{ service.issueCounts()[impact] }} {{ impact }}
                </button>
              }
            </div>
          </div>

          <div class="a11y-panel__search">
            <input
              type="search"
              class="a11y-panel__search-input"
              placeholder="Filter issues..."
              [value]="searchText()"
              (input)="onSearchInput($event)"
              aria-label="Filter accessibility issues" />
          </div>

          <div class="a11y-panel__list" role="tree">
            @for (group of issueGroups(); track group.category) {
              <div class="a11y-panel__group" [class.a11y-panel__group--inactive]="!service.activeCategories().has(group.category)" role="treeitem">
                <button
                  type="button"
                  class="a11y-panel__group-header"
                  [class.a11y-panel__group-header--active]="service.activeCategories().has(group.category)"
                  [attr.aria-expanded]="expandedGroups().has(group.category)"
                  (click)="toggleGroup(group.category)">
                  <span class="a11y-panel__group-arrow" [class.a11y-panel__group-arrow--open]="expandedGroups().has(group.category)">▶</span>
                  <span class="a11y-panel__group-icon">{{ group.icon }}</span>
                  <span class="a11y-panel__group-label">{{ group.label }}</span>
                  <span class="a11y-panel__group-count">{{ group.issues.length }}</span>
                  @if (group.criticalCount > 0) {
                    <span class="a11y-panel__group-badge a11y-panel__group-badge--critical">{{ group.criticalCount }}</span>
                  }
                  @if (group.seriousCount > 0) {
                    <span class="a11y-panel__group-badge a11y-panel__group-badge--serious">{{ group.seriousCount }}</span>
                  }
                  @if (group.moderateCount > 0) {
                    <span class="a11y-panel__group-badge a11y-panel__group-badge--moderate">{{ group.moderateCount }}</span>
                  }
                  @if (group.minorCount > 0) {
                    <span class="a11y-panel__group-badge a11y-panel__group-badge--minor">{{ group.minorCount }}</span>
                  }
                  <button
                    type="button"
                    class="a11y-panel__group-toggle"
                    [class.a11y-panel__group-toggle--active]="service.activeCategories().has(group.category)"
                    (click)="onToggleCategory($event, group.category)"
                    [attr.aria-label]="(service.activeCategories().has(group.category) ? 'Hide' : 'Show') + ' ' + group.label + ' overlays'"
                    title="Toggle overlays">
                    {{ service.activeCategories().has(group.category) ? '👁' : '👁‍🗨' }}
                  </button>
                </button>

                @if (expandedGroups().has(group.category)) {
                  <div class="a11y-panel__group-items" role="group">
                    @for (issue of group.issues; track issue.id) {
                      <button
                        type="button"
                        class="a11y-panel__item"
                        [class.a11y-panel__item--selected]="service.selectedIssue()?.id === issue.id"
                        (click)="onSelectIssue(issue)"
                        role="treeitem">
                        <span class="a11y-panel__item-impact" [class]="'a11y-panel__item-impact--' + issue.impact">
                          {{ issue.impact[0].toUpperCase() }}
                        </span>
                        <span class="a11y-panel__item-body">
                          <span class="a11y-panel__item-message">{{ issue.message }}</span>
                          <span class="a11y-panel__item-element">
                            @if (offScreenIds().has(issue.id)) {
                              <span class="a11y-panel__item-offscreen" title="This element is positioned off-screen and cannot be highlighted">⚠ off-screen</span>
                            } @else if (resolvedOffScreenIds().has(issue.id)) {
                              <span class="a11y-panel__item-resolved" title="This element was off-screen at scan time but is now visible">✓ now visible</span>
                            }
                            {{ describeElement(issue) }}
                          </span>
                        </span>
                      </button>
                    }
                  </div>
                }
              </div>
            } @empty {
              <div class="a11y-panel__empty">
                @if (service.totalIssueCount() === 0) {
                  No accessibility issues found.
                } @else {
                  No issues match the current filters.
                }
              </div>
            }
          </div>

          <div class="a11y-panel__footer">
            <label class="a11y-panel__landmark-toggle">
              <input
                type="checkbox"
                [checked]="service.showLandmarkOverlay()"
                (change)="service.showLandmarkOverlay.set($any($event.target).checked)"
                aria-label="Show page landmark regions" />
              Show landmarks
            </label>
            <div class="a11y-panel__footer-actions">
              <button type="button" class="a11y-panel__action" (click)="service.scan()">
                Re-scan
              </button>
              <button type="button" class="a11y-panel__action" (click)="exportJson()">
                Export JSON
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .a11y-sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    .a11y-panel {
      position: fixed;
      right: 0;
      top: 0;
      height: 100vh;
      z-index: 2147483644;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: row-reverse;
      pointer-events: none;
    }

    .a11y-panel__toggle {
      pointer-events: auto;
      position: relative;
      margin-top: auto;
      margin-bottom: 20px;
      margin-right: 10px;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #1e1e1e;
      color: #fff;
      border: none;
      padding: 0;
      cursor: pointer;
      font-size: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 12px rgba(0,0,0,0.4);
      transition: filter 0.15s;
    }
    .a11y-panel__toggle:hover {
      filter: brightness(1.3);
    }
    .a11y-panel__toggle:focus-visible {
      outline: 2px solid #90caf9;
      outline-offset: 2px;
    }
    .a11y-panel__toggle-icon {
      width: 28px;
      height: 28px;
    }

    .a11y-panel__badge {
      position: absolute;
      top: -4px;
      right: -4px;
      min-width: 18px;
      height: 18px;
      border-radius: 9px;
      font-size: 11px;
      font-weight: 700;
      line-height: 18px;
      text-align: center;
      padding: 0 4px;
    }
    .a11y-panel__badge.a11y-badge--critical { background: #d32f2f; color: #fff; }
    .a11y-panel__badge.a11y-badge--serious { background: #f57c00; color: #fff; }
    .a11y-panel__badge.a11y-badge--moderate { background: #fbc02d; color: #1e1e1e; }
    .a11y-panel__badge.a11y-badge--ok { background: #388e3c; color: #fff; }

    .a11y-panel__content {
      pointer-events: auto;
      width: 380px;
      height: 100vh;
      background: #1e1e1e;
      color: #e0e0e0;
      display: flex;
      flex-direction: column;
      box-shadow: -4px 0 20px rgba(0,0,0,0.4);
      overflow: hidden;
    }

    .a11y-panel__header {
      padding: 16px;
      border-bottom: 1px solid #333;
    }
    .a11y-panel__title {
      margin: 0 0 8px;
      font-size: 16px;
      font-weight: 700;
      color: #fff;
    }
    .a11y-panel__counts {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .a11y-panel__count {
      font-size: 12px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 3px;
      border: 2px solid transparent;
      cursor: pointer;
      transition: filter 0.15s, border-color 0.15s;
    }
    .a11y-panel__count:hover {
      border-color: rgba(255,255,255,0.4);
    }
    .a11y-panel__count:focus-visible {
      outline: 2px solid #90caf9;
      outline-offset: 1px;
    }
    .a11y-panel__count--inactive {
      filter: grayscale(1) brightness(0.4);
      border-color: transparent;
    }
    .a11y-panel__count--inactive:hover {
      filter: grayscale(1) brightness(0.6);
    }
    .a11y-panel__count--critical { background: #d32f2f; color: #fff; }
    .a11y-panel__count--serious { background: #f57c00; color: #fff; }
    .a11y-panel__count--moderate { background: #fbc02d; color: #1e1e1e; }
    .a11y-panel__count--minor { background: #1976d2; color: #fff; }

    .a11y-panel__group-header {
      display: flex;
      align-items: center;
      gap: 6px;
      width: 100%;
      padding: 8px 12px;
      border: none;
      border-bottom: 1px solid #2a2a2a;
      background: #252525;
      color: #e0e0e0;
      text-align: left;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      transition: background 0.1s;
    }
    .a11y-panel__group-header:hover {
      background: #2e2e2e;
    }
    .a11y-panel__group-header:focus-visible {
      outline: 2px solid #90caf9;
      outline-offset: -2px;
    }
    .a11y-panel__group-header--active {
      border-left: 3px solid #7b1fa2;
    }
    .a11y-panel__group-arrow {
      font-size: 9px;
      transition: transform 0.15s;
      flex-shrink: 0;
    }
    .a11y-panel__group-arrow--open {
      transform: rotate(90deg);
    }
    .a11y-panel__group-icon {
      flex-shrink: 0;
      width: 18px;
      text-align: center;
    }
    .a11y-panel__group-label {
      flex: 1;
      min-width: 0;
    }
    .a11y-panel__group-count {
      background: #444;
      color: #ccc;
      padding: 1px 6px;
      border-radius: 8px;
      font-size: 10px;
      font-weight: 700;
    }
    .a11y-panel__group-badge {
      padding: 1px 5px;
      border-radius: 8px;
      font-size: 10px;
      font-weight: 700;
    }
    .a11y-panel__group-badge--critical { background: #d32f2f; color: #fff; }
    .a11y-panel__group-badge--serious { background: #f57c00; color: #fff; }
    .a11y-panel__group-badge--moderate { background: #fbc02d; color: #333; }
    .a11y-panel__group-badge--minor { background: #90a4ae; color: #fff; }
    .a11y-panel__group-toggle {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 14px;
      padding: 0 4px;
      color: #666;
      transition: color 0.1s;
    }
    .a11y-panel__group-toggle:hover { color: #e0e0e0; }
    .a11y-panel__group-toggle--active { color: #e0e0e0; }
    .a11y-panel__group--inactive {
      filter: grayscale(1) brightness(0.6);
    }
    .a11y-panel__group--inactive .a11y-panel__group-header {
      background: #1e1e1e;
    }
    .a11y-panel__group-items {
      /* intentionally empty, items stack naturally */
    }
    .a11y-panel__filter:focus-visible {
      outline: 2px solid #90caf9;
      outline-offset: 1px;
    }

    .a11y-panel__search {
      padding: 10px 16px;
      border-bottom: 1px solid #333;
    }
    .a11y-panel__search-input {
      width: 100%;
      box-sizing: border-box;
      background: #2a2a2a;
      border: 1px solid #444;
      border-radius: 4px;
      color: #e0e0e0;
      padding: 6px 10px;
      font-size: 13px;
    }
    .a11y-panel__search-input:focus {
      outline: none;
      border-color: #90caf9;
    }

    .a11y-panel__list {
      flex: 1;
      overflow-y: auto;
      padding: 4px 0;
    }

    .a11y-panel__item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      width: 100%;
      padding: 10px 16px;
      border: none;
      border-bottom: 1px solid #2a2a2a;
      background: transparent;
      color: #e0e0e0;
      text-align: left;
      cursor: pointer;
      font-size: 12px;
      line-height: 1.4;
      transition: background 0.1s;
    }
    .a11y-panel__item:hover {
      background: #2a2a2a;
    }
    .a11y-panel__item--selected {
      background: #333 !important;
      border-left: 3px solid #90caf9;
    }
    .a11y-panel__item:focus-visible {
      outline: 2px solid #90caf9;
      outline-offset: -2px;
    }

    .a11y-panel__item-impact {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      font-size: 11px;
      font-weight: 700;
      text-align: center;
      line-height: 20px;
    }
    .a11y-panel__item-impact--critical { background: #d32f2f; color: #fff; }
    .a11y-panel__item-impact--serious { background: #f57c00; color: #fff; }
    .a11y-panel__item-impact--moderate { background: #fbc02d; color: #1e1e1e; }
    .a11y-panel__item-impact--minor { background: #1976d2; color: #fff; }

    .a11y-panel__item-body {
      flex: 1;
      min-width: 0;
    }
    .a11y-panel__item-message {
      display: block;
    }
    .a11y-panel__item-element {
      display: block;
      color: #90caf9;
      font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
      font-size: 11px;
      margin-top: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .a11y-panel__item-offscreen {
      display: inline-block;
      background: #5d4037;
      color: #ffcc80;
      font-size: 10px;
      font-weight: 600;
      padding: 1px 5px;
      border-radius: 3px;
      margin-right: 4px;
      vertical-align: middle;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .a11y-panel__item-resolved {
      display: inline-block;
      background: #2e7d32;
      color: #c8e6c9;
      font-size: 10px;
      font-weight: 600;
      padding: 1px 5px;
      border-radius: 3px;
      margin-right: 4px;
      vertical-align: middle;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .a11y-panel__empty {
      padding: 32px 16px;
      text-align: center;
      color: #888;
      font-size: 13px;
    }

    .a11y-panel__footer {
      padding: 12px 16px;
      border-top: 1px solid #333;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .a11y-panel__landmark-toggle {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #ccc;
      cursor: pointer;
    }
    .a11y-panel__landmark-toggle input {
      accent-color: #7c4dff;
      cursor: pointer;
    }
    .a11y-panel__footer-actions {
      display: flex;
      gap: 8px;
    }
    .a11y-panel__action {
      flex: 1;
      padding: 6px 12px;
      background: #333;
      color: #e0e0e0;
      border: 1px solid #444;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      transition: background 0.1s;
    }
    .a11y-panel__action:hover {
      background: #444;
    }
    .a11y-panel__action:focus-visible {
      outline: 2px solid #90caf9;
      outline-offset: 1px;
    }
  `,
})
export class IssuePanelComponent {
  protected readonly service = inject(A11yOverlayService);
  protected readonly describeElement = describeElement;
  private readonly elRef = inject(ElementRef<HTMLElement>);

  readonly offScreenIds = computed(() => {
    // Depend on scrollTick so this recomputes on scroll
    this.service.scrollTick();
    const ids = new Set<string>();
    for (const issue of this.service.issues()) {
      if (issue.element && isElementOffScreen(issue.element)) {
        ids.add(issue.id);
      }
    }
    return ids;
  });

  /** Focus-order off-screen issues whose elements are now visible on-screen */
  readonly resolvedOffScreenIds = computed(() => {
    this.service.scrollTick();
    const ids = new Set<string>();
    for (const issue of this.service.issues()) {
      if (
        issue.category === 'focus-order' &&
        (issue.id.startsWith('focus-offscreen-') || issue.id.startsWith('focus-broken-flow-')) &&
        issue.element &&
        !isElementOffScreen(issue.element)
      ) {
        ids.add(issue.id);
      }
    }
    return ids;
  });

  readonly isOpen = signal(false);
  readonly searchText = signal('');
  readonly activeImpacts = signal<Set<A11yImpact>>(
    new Set<A11yImpact>(IMPACT_ORDER)
  );
  readonly expandedGroups = signal<Set<A11yCategory>>(
    new Set<A11yCategory>(['axe', 'focus-order', 'headings', 'landmarks', 'link-text'])
  );

  readonly impactOrder = IMPACT_ORDER;
  readonly categoryLabels = CATEGORY_LABELS;

  constructor() {
    // React to selection changes from inline highlight clicks
    effect(() => {
      const selected = this.service.selectedIssue();
      if (!selected) return;

      // Open panel if closed
      if (!this.isOpen()) {
        this.isOpen.set(true);
      }

      // Expand the group containing the selected issue
      this.expandedGroups.update((groups) => {
        if (groups.has(selected.category)) return groups;
        const next = new Set(groups);
        next.add(selected.category);
        return next;
      });

      // Scroll the selected item into view after the DOM updates
      requestAnimationFrame(() => {
        const selectedEl = this.elRef.nativeElement.querySelector(
          '.a11y-panel__item--selected'
        );
        selectedEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    });
  }

  readonly issueGroups = computed<IssueGroup[]>(() => {
    const search = this.searchText().toLowerCase();
    const impacts = this.activeImpacts();
    // Use ALL issues, not filteredIssues, so toggled-off categories still show in the panel
    let issues = this.service.issues();
    if (impacts.size < IMPACT_ORDER.length) {
      issues = issues.filter((i) => impacts.has(i.impact));
    }
    if (search) {
      issues = issues.filter(
        (i) =>
          i.message.toLowerCase().includes(search) ||
          i.selector.toLowerCase().includes(search) ||
          describeElement(i).toLowerCase().includes(search)
      );
    }

    const categoryOrder: A11yCategory[] = ['axe', 'focus-order', 'headings', 'landmarks', 'link-text', 'interactive'];
    const grouped = new Map<A11yCategory, A11yIssue[]>();
    for (const issue of issues) {
      const list = grouped.get(issue.category) ?? [];
      list.push(issue);
      grouped.set(issue.category, list);
    }

    return categoryOrder
      .filter((cat) => grouped.has(cat))
      .map((cat) => {
        const catIssues = grouped.get(cat)!;
        return {
          category: cat,
          label: CATEGORY_LABELS[cat],
          icon: CATEGORY_ICONS[cat],
          issues: catIssues,
          criticalCount: catIssues.filter((i) => i.impact === 'critical').length,
          seriousCount: catIssues.filter((i) => i.impact === 'serious').length,
          moderateCount: catIssues.filter((i) => i.impact === 'moderate').length,
          minorCount: catIssues.filter((i) => i.impact === 'minor').length,
        };
      });
  });

  readonly badgeClass = computed(() => {
    const counts = this.service.issueCounts();
    if (counts.critical > 0) return 'a11y-badge--critical';
    if (counts.serious > 0) return 'a11y-badge--serious';
    if (counts.moderate > 0) return 'a11y-badge--moderate';
    return 'a11y-badge--ok';
  });

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchText.set(input.value);
  }

  toggleGroup(category: A11yCategory): void {
    this.expandedGroups.update((groups) => {
      const next = new Set(groups);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }

  onToggleCategory(event: Event, category: A11yCategory): void {
    event.stopPropagation();
    this.service.toggleCategory(category);
  }

  toggleImpact(impact: A11yImpact): void {
    this.activeImpacts.update((impacts) => {
      const next = new Set(impacts);
      if (next.has(impact)) {
        // Don't allow deselecting all
        if (next.size > 1) {
          next.delete(impact);
        }
      } else {
        next.add(impact);
      }
      return next;
    });
  }

  togglePanel(): void {
    if (this.isOpen()) {
      // Closing — clear selection so the effect doesn't re-open
      this.service.highlightIssue(null);
      this.isOpen.set(false);
    } else {
      this.isOpen.set(true);
    }
  }

  onSelectIssue(issue: A11yIssue): void {
    this.service.highlightIssue(issue);
  }

  exportJson(): void {
    const data = this.service.filteredIssues().map((i) => ({
      id: i.id,
      category: i.category,
      selector: i.selector,
      impact: i.impact,
      message: i.message,
      helpUrl: i.helpUrl,
      wcagTags: i.wcagTags,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'a11y-issues.json';
    a.click();
    URL.revokeObjectURL(url);
  }
}
