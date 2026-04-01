import {
  Component,
  ChangeDetectionStrategy,
  input,
  signal,
  effect,
  DestroyRef,
  inject,
} from '@angular/core';
import { ElementRect, getElementRect, isElementVisible } from '../../utils/dom-position';

export interface FocusBadgeData {
  element: HTMLElement;
  index: number;
  tabIndex: number;
  hasStaticError: boolean; // e.g. positive tabindex — never changes
}

@Component({
  selector: 'a11y-focus-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.top.px]': 'badgeTop()',
    '[style.left.px]': 'badgeLeft()',
    '[style.display]': 'visible() ? "flex" : "none"',
    '[attr.title]': 'tooltipText()',
    '[class.a11y-focus-badge--error]': 'isError()',
  },
  templateUrl: './focus-badge.component.html',
  styleUrl: './focus-badge.component.scss',
})
export class FocusBadgeComponent {
  readonly data = input.required<FocusBadgeData>();

  private readonly destroyRef = inject(DestroyRef);

  readonly rect = signal<ElementRect>({ top: 0, left: 0, width: 0, height: 0 });
  readonly visible = signal(true);
  readonly isError = signal(false);

  private static readonly BADGE_SIZE = 22;

  badgeTop(): number {
    const r = this.rect();
    const raw = r.top + r.height - FocusBadgeComponent.BADGE_SIZE / 2;
    return Math.max(0, Math.min(raw, window.innerHeight - FocusBadgeComponent.BADGE_SIZE));
  }

  badgeLeft(): number {
    const r = this.rect();
    const raw = r.left - FocusBadgeComponent.BADGE_SIZE / 2;
    return Math.max(0, Math.min(raw, window.innerWidth - FocusBadgeComponent.BADGE_SIZE));
  }

  private resizeObserver: ResizeObserver | null = null;
  private scrollHandler: (() => void) | null = null;
  private resizeHandler: (() => void) | null = null;
  private animFrameId = 0;
  private trackedElement: HTMLElement | null = null;

  tooltipText(): string {
    const d = this.data();
    return `Tab order: ${d.index + 1} (tabindex=${d.tabIndex})`;
  }

  private readonly trackEffect = effect(() => {
    const d = this.data();
    // Re-establish tracking whenever the data (and element) changes
    this.teardownTracking();
    this.trackedElement = d.element;
    this.updatePosition();
    this.setupTracking();
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.teardownTracking());
  }

  private updatePosition(): void {
    const el = this.trackedElement;
    if (!el || !isElementVisible(el)) {
      this.visible.set(false);
      return;
    }
    const r = getElementRect(el);
    const elementFullyOutside =
      r.top + r.height < 0 ||
      r.top > window.innerHeight ||
      r.left + r.width < 0 ||
      r.left > window.innerWidth;
    this.visible.set(!elementFullyOutside);
    this.rect.set(r);

    // Dynamic error: static error (positive tabindex) OR currently off-screen
    const d = this.data();
    this.isError.set(d.hasStaticError || elementFullyOutside);
  }

  private setupTracking(): void {
    const el = this.trackedElement;
    if (!el) return;

    this.resizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = requestAnimationFrame(() => this.updatePosition());
    });
    this.resizeObserver.observe(el);

    const handler = () => {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = requestAnimationFrame(() => this.updatePosition());
    };
    this.scrollHandler = handler;
    this.resizeHandler = handler;
    document.addEventListener('scroll', handler, { capture: true, passive: true });
    window.addEventListener('resize', handler, { passive: true });
  }

  private teardownTracking(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    cancelAnimationFrame(this.animFrameId);
    if (this.scrollHandler) {
      document.removeEventListener('scroll', this.scrollHandler, { capture: true } as EventListenerOptions);
      this.scrollHandler = null;
    }
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
  }
}
