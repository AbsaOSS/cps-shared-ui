import {
  Component,
  ChangeDetectionStrategy,
  input,
  signal,
  OnInit,
  DestroyRef,
  inject,
} from '@angular/core';
import { ElementRect, getElementRect, isElementVisible } from '../../utils/dom-position';

export interface LandmarkData {
  element: HTMLElement;
  role: string;
  label: string;
}

@Component({
  selector: 'a11y-landmark-overlay',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.top.px]': 'clampedTop()',
    '[style.left.px]': 'clampedLeft()',
    '[style.width.px]': 'clampedWidth()',
    '[style.height.px]': 'clampedHeight()',
    '[style.display]': 'visible() ? "block" : "none"',
  },
  template: `
    <span class="a11y-landmark__label">{{ data().label }}</span>
  `,
  styles: `
    :host {
      position: absolute;
      border: 2px dashed #7b1fa2;
      background: rgba(123, 31, 162, 0.04);
      border-radius: 4px;
      z-index: 2147483640;
      pointer-events: none;
    }

    .a11y-landmark__label {
      position: absolute;
      top: -1px;
      left: -1px;
      padding: 1px 6px;
      background: #7b1fa2;
      color: #fff;
      font: bold 10px/16px -apple-system, BlinkMacSystemFont, sans-serif;
      border-radius: 0 0 4px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  `,
})
export class LandmarkOverlayComponent implements OnInit {
  readonly data = input.required<LandmarkData>();

  private readonly destroyRef = inject(DestroyRef);

  readonly rect = signal<ElementRect>({ top: 0, left: 0, width: 0, height: 0 });
  readonly visible = signal(true);

  clampedTop(): number {
    return Math.max(0, this.rect().top);
  }

  clampedLeft(): number {
    return Math.max(0, this.rect().left);
  }

  clampedWidth(): number {
    const r = this.rect();
    const left = Math.max(0, r.left);
    return Math.min(r.width - (left - r.left), window.innerWidth - left);
  }

  clampedHeight(): number {
    const r = this.rect();
    const top = Math.max(0, r.top);
    return Math.min(r.height - (top - r.top), window.innerHeight - top);
  }

  private resizeObserver: ResizeObserver | null = null;
  private animFrameId = 0;

  ngOnInit(): void {
    this.updatePosition();
    this.setupTracking();
  }

  private updatePosition(): void {
    const el = this.data().element;
    if (!isElementVisible(el)) {
      this.visible.set(false);
      return;
    }
    this.visible.set(true);
    this.rect.set(getElementRect(el));
  }

  private setupTracking(): void {
    const el = this.data().element;
    this.resizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = requestAnimationFrame(() => this.updatePosition());
    });
    this.resizeObserver.observe(el);

    const handler = () => {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = requestAnimationFrame(() => this.updatePosition());
    };
    document.addEventListener('scroll', handler, { capture: true, passive: true });
    window.addEventListener('resize', handler, { passive: true });

    this.destroyRef.onDestroy(() => {
      this.resizeObserver?.disconnect();
      cancelAnimationFrame(this.animFrameId);
      document.removeEventListener('scroll', handler, { capture: true } as EventListenerOptions);
      window.removeEventListener('resize', handler);
    });
  }
}
