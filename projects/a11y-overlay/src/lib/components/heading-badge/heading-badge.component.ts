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

export interface HeadingBadgeData {
  element: HTMLElement;
  level: number;
  hasError: boolean;
}

@Component({
  selector: 'a11y-heading-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.top.px]': 'clampedTop()',
    '[style.left.px]': 'clampedLeft()',
    '[style.display]': 'visible() ? "flex" : "none"',
  },
  templateUrl: './heading-badge.component.html',
  styleUrl: './heading-badge.component.scss',
})
export class HeadingBadgeComponent {
  readonly data = input.required<HeadingBadgeData>();

  private readonly destroyRef = inject(DestroyRef);

  readonly rect = signal<ElementRect>({ top: 0, left: 0, width: 0, height: 0 });
  readonly visible = signal(true);

  private static readonly BADGE_WIDTH = 34;
  private static readonly BADGE_HEIGHT = 20;

  clampedTop(): number {
    const raw = this.rect().top;
    return Math.max(0, Math.min(raw, window.innerHeight - HeadingBadgeComponent.BADGE_HEIGHT));
  }

  clampedLeft(): number {
    const raw = this.rect().left - 36;
    return Math.max(0, Math.min(raw, window.innerWidth - HeadingBadgeComponent.BADGE_WIDTH));
  }

  private resizeObserver: ResizeObserver | null = null;
  private scrollHandler: (() => void) | null = null;
  private resizeHandler: (() => void) | null = null;
  private animFrameId = 0;
  private trackedElement: HTMLElement | null = null;

  private readonly trackEffect = effect(() => {
    const d = this.data();
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
    this.visible.set(true);
    this.rect.set(getElementRect(el));
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
