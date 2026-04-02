import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  effect,
  ElementRef
} from '@angular/core';
import { A11yOverlayService } from '../../services/a11y-overlay.service';
import {
  A11yIssue,
  A11yCategory,
  A11yImpact
} from '../../models/a11y-issue.model';
import { isElementOffScreen } from '../../utils/dom-position';

const IMPACT_ORDER: A11yImpact[] = ['critical', 'serious', 'moderate', 'minor'];

const CATEGORY_LABELS: Record<A11yCategory, string> = {
  axe: 'Axe Rules',
  'focus-order': 'Focus Order',
  headings: 'Headings',
  landmarks: 'Page Structure',
  'link-text': 'Link & Button Text',
  interactive: 'Interactive Elements'
};

const CATEGORY_ICONS: Record<A11yCategory, string> = {
  axe: '🔍',
  'focus-order': '⇥',
  headings: 'H',
  landmarks: '◈',
  'link-text': '🔗',
  interactive: '☞'
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
  const textSnippet =
    textContent.length > 30 ? textContent.substring(0, 30) + '…' : textContent;

  const parts: string[] = [`<${tag}${id}>`];

  if (role) {
    parts.push(`[${role}]`);
  }

  if (ariaLabel) {
    parts.push(
      `"${ariaLabel.length > 30 ? ariaLabel.substring(0, 30) + '…' : ariaLabel}"`
    );
  } else if (textSnippet && textSnippet.length > 0) {
    parts.push(`"${textSnippet}"`);
  }

  return parts.join(' ');
}

@Component({
  selector: 'a11y-issue-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './issue-panel.component.html',
  styleUrl: './issue-panel.component.scss'
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
        (issue.id.startsWith('focus-offscreen-') ||
          issue.id.startsWith('focus-broken-flow-')) &&
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
    new Set<A11yCategory>([
      'axe',
      'focus-order',
      'headings',
      'landmarks',
      'link-text'
    ])
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

    const categoryOrder: A11yCategory[] = [
      'axe',
      'focus-order',
      'headings',
      'landmarks',
      'link-text',
      'interactive'
    ];
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
          criticalCount: catIssues.filter((i) => i.impact === 'critical')
            .length,
          seriousCount: catIssues.filter((i) => i.impact === 'serious').length,
          moderateCount: catIssues.filter((i) => i.impact === 'moderate')
            .length,
          minorCount: catIssues.filter((i) => i.impact === 'minor').length
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
      wcagTags: i.wcagTags
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'a11y-issues.json';
    a.click();
    URL.revokeObjectURL(url);
  }
}
