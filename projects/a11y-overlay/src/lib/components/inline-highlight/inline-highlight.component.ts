import {
  Component,
  ChangeDetectionStrategy,
  input,
  signal,
  computed,
  DestroyRef,
  inject,
  OnInit,
} from '@angular/core';
import { A11yIssue, ElementHighlight } from '../../models/a11y-issue.model';
import { A11yOverlayService } from '../../services/a11y-overlay.service';
import { ElementRect, getElementRect, isElementVisible } from '../../utils/dom-position';

@Component({
  selector: 'a11y-inline-highlight',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.top.px]': 'rect().top',
    '[style.left.px]': 'rect().left',
    '[style.width.px]': 'rect().width',
    '[style.height.px]': 'rect().height',
    '[style.display]': 'visible() ? "block" : "none"',
    '[class]': 'hostClasses()',
  },
  template: `
    <div class="a11y-indicator" [style.top.px]="indicatorOffset().top" [style.left.px]="indicatorOffset().left" (mouseenter)="onMouseEnter($event)" (mouseleave)="onMouseLeave()" (click)="onClick()">
      <span class="a11y-indicator__dot" aria-hidden="true">!</span>
    </div>
  `,
  styles: `
    :host {
      position: absolute;
      pointer-events: none;
      border: 2px solid transparent;
      border-radius: 2px;
      box-sizing: border-box;
      z-index: 2147483641;
    }

    :host.a11y-highlight--selected {
      z-index: 2147483643;
      border-width: 3px;
      border-color: #42a5f5 !important;
      background: rgba(66, 165, 245, 0.12) !important;
      box-shadow: 0 0 0 4px rgba(66, 165, 245, 0.6), 0 0 16px rgba(66, 165, 245, 0.4);
      animation: a11y-selected-pulse 0.6s ease-out 2;
    }

    @keyframes a11y-selected-pulse {
      0% { box-shadow: 0 0 0 4px rgba(66, 165, 245, 0.6), 0 0 16px rgba(66, 165, 245, 0.4); }
      50% { box-shadow: 0 0 0 8px rgba(66, 165, 245, 0.8), 0 0 30px rgba(66, 165, 245, 0.6); }
      100% { box-shadow: 0 0 0 4px rgba(66, 165, 245, 0.6), 0 0 16px rgba(66, 165, 245, 0.4); }
    }

    :host.a11y-impact--critical {
      border-color: #d32f2f;
      background: rgba(211, 47, 47, 0.08);
    }
    :host.a11y-impact--serious {
      border-color: #f57c00;
      background: rgba(245, 124, 0, 0.08);
    }
    :host.a11y-impact--moderate {
      border-color: #fbc02d;
      background: rgba(251, 192, 45, 0.08);
    }
    :host.a11y-impact--minor {
      border-color: #1976d2;
      background: rgba(25, 118, 210, 0.08);
    }

    .a11y-indicator {
      position: fixed;
      width: 24px;
      height: 24px;
      cursor: pointer;
      pointer-events: auto;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2147483646;
    }

    .a11y-indicator__dot {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #d32f2f;
      color: #fff;
      font: bold 11px/1 -apple-system, BlinkMacSystemFont, sans-serif;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
    }

    :host.a11y-impact--serious .a11y-indicator__dot { background: #f57c00; }
    :host.a11y-impact--moderate .a11y-indicator__dot { background: #fbc02d; color: #1e1e1e; }
    :host.a11y-impact--minor .a11y-indicator__dot { background: #1976d2; }

    :host.a11y-highlight--ghost {
      border-color: transparent !important;
      background: transparent !important;
      box-shadow: none !important;
    }
    :host.a11y-highlight--ghost .a11y-indicator {
      display: none;
    }
  `,
})
export class InlineHighlightComponent implements OnInit {
  readonly highlight = input.required<ElementHighlight>();

  private readonly service = inject(A11yOverlayService);
  private readonly destroyRef = inject(DestroyRef);

  readonly showTooltip = signal(false);
  readonly rect = signal<ElementRect>({ top: 0, left: 0, width: 0, height: 0 });
  readonly visible = signal(true);

  private resizeObserver: ResizeObserver | null = null;
  private animFrameId = 0;

  /** Selected if ANY of the grouped issues is the currently selected issue. */
  readonly selected = computed(() => {
    const sel = this.service.selectedIssue();
    if (!sel) return false;
    return this.highlight().issues.some((i) => i.id === sel.id);
  });

  readonly impactClass = computed(
    () => `a11y-impact--${this.highlight().impact}`
  );

  readonly isGhost = computed(() =>
    this.highlight().issues.every((i) => i.category === 'focus-order')
  );

  readonly hostClasses = computed(() => {
    const classes = [this.impactClass()];
    if (this.selected()) classes.push('a11y-highlight--selected');
    if (this.isGhost() && !this.selected()) classes.push('a11y-highlight--ghost');
    return classes.join(' ');
  });

  /** Viewport-fixed coordinates for the indicator dot. */
  readonly indicatorOffset = computed(() => {
    const r = this.rect();
    const hitSize = 24; // hit area size
    const halfHit = hitSize / 2;
    const pad = 2;

    // Desired viewport position: centered on host top-right corner
    const desiredVpX = r.left + r.width - halfHit;
    const desiredVpY = r.top - halfHit;

    // Clamp to viewport
    const vpX = Math.max(pad, Math.min(desiredVpX, window.innerWidth - hitSize - pad));
    const vpY = Math.max(pad, Math.min(desiredVpY, window.innerHeight - hitSize - pad));

    return { left: vpX, top: vpY };
  });

  ngOnInit(): void {
    this.updatePosition();
    this.setupTracking();
  }

  onMouseEnter(event: MouseEvent): void {
    this.service.cancelTooltipDismiss();
    const indicator = event.currentTarget as HTMLElement;
    const anchorRect = indicator.getBoundingClientRect();
    const elementRect = this.highlight().element.getBoundingClientRect();
    this.service.hoveredHighlight.set({ highlight: this.highlight(), anchorRect, elementRect });
  }

  onMouseLeave(): void {
    this.service.scheduleTooltipDismiss(this.highlight().primary.id);
  }

  onClick(): void {
    this.service.highlightIssue(this.highlight().primary);
  }

  private updatePosition(): void {
    const el = this.highlight().element;
    if (!isElementVisible(el)) {
      this.visible.set(false);
      return;
    }
    this.visible.set(true);
    this.rect.set(getElementRect(el));
  }

  private setupTracking(): void {
    const el = this.highlight().element;

    this.resizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = requestAnimationFrame(() => this.updatePosition());
    });
    this.resizeObserver.observe(el);

    const scrollHandler = () => {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = requestAnimationFrame(() => this.updatePosition());
    };
    document.addEventListener('scroll', scrollHandler, { capture: true, passive: true });
    window.addEventListener('resize', scrollHandler, { passive: true });

    this.destroyRef.onDestroy(() => {
      this.resizeObserver?.disconnect();
      cancelAnimationFrame(this.animFrameId);
      document.removeEventListener('scroll', scrollHandler, { capture: true } as EventListenerOptions);
      window.removeEventListener('resize', scrollHandler);
    });
  }
}
