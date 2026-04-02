import {
  Injectable,
  signal,
  computed,
  inject,
  DestroyRef,
  NgZone,
  isDevMode
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  A11yIssue,
  A11yCategory,
  A11yImpact,
  ElementHighlight
} from '../models/a11y-issue.model';
import {
  A11Y_OVERLAY_CONFIG,
  A11yOverlayConfig,
  DEFAULT_A11Y_CONFIG
} from '../models/a11y-config.model';
import { AxeScanner } from '../scanners/axe-scanner';
import { FocusOrderScanner } from '../scanners/focus-order-scanner';
import { HeadingScanner } from '../scanners/heading-scanner';
import { LandmarkScanner } from '../scanners/landmark-scanner';
import { LinkTextScanner } from '../scanners/link-text-scanner';
import { InteractiveScanner } from '../scanners/interactive-scanner';
import { Scanner } from '../scanners/scanner.interface';

@Injectable()
export class A11yOverlayService {
  private readonly config = inject(A11Y_OVERLAY_CONFIG, { optional: true });
  private readonly router = inject(Router, { optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly zone = inject(NgZone);

  private readonly scannerMap: Record<A11yCategory, Scanner> = {
    axe: inject(AxeScanner),
    'focus-order': inject(FocusOrderScanner),
    headings: inject(HeadingScanner),
    landmarks: inject(LandmarkScanner),
    'link-text': inject(LinkTextScanner),
    interactive: inject(InteractiveScanner)
  };

  private mutationObserver: MutationObserver | null = null;
  private domObserver: MutationObserver | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private domChangeTimer: ReturnType<typeof setTimeout> | null = null;
  private scrollTickTimer: ReturnType<typeof setTimeout> | null = null;
  private scrollListener: (() => void) | null = null;

  readonly scrollTick = signal(0);
  readonly showLandmarkOverlay = signal(false);
  /** Bumped when DOM structure changes — drives badge recomputation. */
  readonly domChangeTick = signal(0);
  readonly issues = signal<A11yIssue[]>([]);
  readonly isActive = signal(false);
  readonly activeCategories = signal<Set<A11yCategory>>(
    new Set(this.resolveCategories())
  );
  readonly selectedIssue = signal<A11yIssue | null>(null);
  readonly hoveredHighlight = signal<{
    highlight: ElementHighlight;
    anchorRect: DOMRect;
    elementRect: DOMRect;
  } | null>(null);
  private tooltipDismissTimer: ReturnType<typeof setTimeout> | null = null;

  /** Schedule tooltip dismissal. Call cancelTooltipDismiss() from the tooltip mouseenter to keep it alive. */
  scheduleTooltipDismiss(highlightId: string): void {
    this.cancelTooltipDismiss();
    this.tooltipDismissTimer = setTimeout(() => {
      const current = this.hoveredHighlight();
      if (current?.highlight.primary.id === highlightId) {
        this.hoveredHighlight.set(null);
      }
    }, 200);
  }

  cancelTooltipDismiss(): void {
    if (this.tooltipDismissTimer) {
      clearTimeout(this.tooltipDismissTimer);
      this.tooltipDismissTimer = null;
    }
  }

  readonly filteredIssues = computed(() => {
    const active = this.activeCategories();
    return this.issues().filter((i) => active.has(i.category));
  });

  readonly issueCounts = computed(() => {
    const counts: Record<A11yImpact, number> = {
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0
    };
    for (const issue of this.filteredIssues()) {
      counts[issue.impact]++;
    }
    return counts;
  });

  readonly totalIssueCount = computed(() => this.filteredIssues().length);

  initialize(): void {
    const enabled = this.config?.enabled ?? isDevMode();
    if (!enabled) return;

    this.isActive.set(true);
    this.setupTriggers();
    this.setupScrollTick();
    this.setupDomObserver();

    // Initial scan after DOM settles
    setTimeout(() => this.scan(), 500);
  }

  async scan(): Promise<void> {
    if (!this.isActive()) return;

    const root = document.body;
    const categories = this.resolveCategories();
    const scanners = categories.map((cat) => this.scannerMap[cat]);

    const results = await Promise.allSettled(scanners.map((s) => s.scan(root)));

    const allIssues: A11yIssue[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'fulfilled') {
        for (const issue of result.value) {
          if (!seen.has(issue.id)) {
            seen.add(issue.id);
            allIssues.push(issue);
          }
        }
      }
    }

    // Merge: keep existing issues for still-connected elements that the new scan didn't find.
    // Axe-core can produce different results for the same elements depending on page context
    // (e.g., visibility heuristics, scroll position). Preserve existing issues for elements
    // that are still in the DOM to avoid losing sidebar/persistent highlights on page changes.
    this.zone.run(() => {
      const newIdSet = new Set(allIssues.map((i) => i.id));
      const existing = this.issues();
      const preserved: A11yIssue[] = [];
      for (const old of existing) {
        if (!newIdSet.has(old.id) && old.element.isConnected) {
          // Check if the new scan has any issue for this same element (by reference)
          const newHasElement = allIssues.some(
            (n) => n.element === old.element && n.category === old.category
          );
          if (!newHasElement) {
            preserved.push(old);
          }
        }
      }
      const merged = [...allIssues, ...preserved];
      this.issues.set(merged);
      this.domChangeTick.update((v) => v + 1);
    });
  }

  highlightIssue(issue: A11yIssue | null): void {
    this.selectedIssue.set(issue);
    if (issue?.element) {
      const rect = issue.element.getBoundingClientRect();
      // Only skip scroll for zero-dimension elements (truly hidden/collapsed)
      if (rect.width > 0 || rect.height > 0) {
        issue.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  toggleCategory(category: A11yCategory): void {
    this.activeCategories.update((cats) => {
      const next = new Set(cats);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }

  toggle(): void {
    if (this.isActive()) {
      this.isActive.set(false);
      this.issues.set([]);
      this.teardownMutationObserver();
    } else {
      this.isActive.set(true);
      this.setupTriggers();
      this.scan();
    }
  }

  private resolveCategories(): A11yCategory[] {
    return this.config?.categories ?? DEFAULT_A11Y_CONFIG.categories;
  }

  private setupTriggers(): void {
    const scanOn = this.config?.scanOn ?? DEFAULT_A11Y_CONFIG.scanOn;

    if (scanOn === 'navigation' || scanOn === 'mutation') {
      this.router?.events
        .pipe(
          filter((e) => e instanceof NavigationEnd),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe(() => {
          // Purge issues referencing elements no longer in the DOM,
          // but keep issues for persistent elements (like sidebar)
          const current = this.issues();
          const connected = current.filter((i) => i.element.isConnected);
          if (connected.length !== current.length) {
            this.issues.set(connected);
          }
          this.selectedIssue.set(null);
          this.hoveredHighlight.set(null);
          // Wait for Angular to render the new route, then re-scan
          setTimeout(() => this.scan(), 600);
        });
    }

    if (scanOn === 'mutation') {
      this.setupMutationObserver();
    }
  }

  private setupMutationObserver(): void {
    this.teardownMutationObserver();
    const debounceMs =
      this.config?.debounceMs ?? DEFAULT_A11Y_CONFIG.debounceMs;

    this.zone.runOutsideAngular(() => {
      this.mutationObserver = new MutationObserver((mutations) => {
        const hasRelevantMutation = mutations.some(
          (m) =>
            !(
              m.target instanceof HTMLElement &&
              m.target.closest('a11y-overlay')
            )
        );
        if (!hasRelevantMutation) return;

        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
          this.zone.run(() => this.scan());
        }, debounceMs);
      });

      this.mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style', 'hidden', 'aria-hidden']
      });
    });

    this.destroyRef.onDestroy(() => this.teardownMutationObserver());
  }

  private teardownMutationObserver(): void {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  private setupDomObserver(): void {
    this.zone.runOutsideAngular(() => {
      this.domObserver = new MutationObserver((mutations) => {
        // Ignore mutations caused by the overlay itself to prevent infinite loops
        const hasRelevantMutation = mutations.some(
          (m) =>
            !(
              m.target instanceof HTMLElement &&
              m.target.closest('a11y-overlay')
            )
        );
        if (!hasRelevantMutation) return;

        if (this.domChangeTimer) clearTimeout(this.domChangeTimer);
        this.domChangeTimer = setTimeout(() => {
          this.zone.run(() => this.domChangeTick.update((v) => v + 1));
        }, 200);
      });
      this.domObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style', 'hidden', 'aria-hidden']
      });
    });
    this.destroyRef.onDestroy(() => {
      this.domObserver?.disconnect();
      if (this.domChangeTimer) clearTimeout(this.domChangeTimer);
    });
  }

  private setupScrollTick(): void {
    const handler = () => {
      if (this.scrollTickTimer) clearTimeout(this.scrollTickTimer);
      this.scrollTickTimer = setTimeout(() => {
        this.zone.run(() => this.scrollTick.update((v) => v + 1));
      }, 150);
    };
    this.scrollListener = handler;
    this.zone.runOutsideAngular(() => {
      document.addEventListener('scroll', handler, {
        capture: true,
        passive: true
      });
    });
    this.destroyRef.onDestroy(() => {
      document.removeEventListener('scroll', handler, { capture: true });
      if (this.scrollTickTimer) clearTimeout(this.scrollTickTimer);
    });
  }
}
