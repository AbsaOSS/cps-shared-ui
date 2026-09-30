import {
  Component,
  effect,
  input,
  inject,
  signal,
  ChangeDetectionStrategy,
  computed,
  viewChild,
  ElementRef,
  PLATFORM_ID,
  type Signal,
  type WritableSignal
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CpsButtonComponent } from 'cps-ui-kit';
import { CpsLoggerService } from 'cps-telemetry';
import '../../services/telemetry.schema';
import { AppTelemetryService } from '../../services/app-telemetry.service';
import hljs from 'highlight.js/lib/core';
import xml from 'highlight.js/lib/languages/xml';
import typescript from 'highlight.js/lib/languages/typescript';

hljs.registerLanguage('xml', xml);
hljs.registerLanguage('typescript', typescript);

type TabId = 'preview' | 'html' | 'ts';

@Component({
  imports: [CpsButtonComponent],
  selector: 'app-code-example',
  templateUrl: './code-example.component.html',
  styleUrl: './code-example.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CodeExampleComponent {
  private static instanceCount = 0;

  htmlCode = input<string | undefined>();
  tsCode = input<string | undefined>();
  label = input('');
  previewOutside = input(false);

  private sanitizer = inject(DomSanitizer);
  private platformId = inject(PLATFORM_ID);
  private logger = inject(CpsLoggerService).getLogger('docs');
  private appTelemetry = inject(AppTelemetryService);

  instanceId = `code-example-${++CodeExampleComponent.instanceCount}`;
  activeTab = signal<TabId>('preview');
  copied = signal(false);
  copyFailed = signal(false);
  highlightedCode = signal<SafeHtml>('');
  highlightedTsCode = signal<SafeHtml>('');
  tabs = signal<TabId[]>(['preview']);

  private previewEl = viewChild<ElementRef<HTMLElement>>('previewPanel');
  private htmlPreEl = viewChild<ElementRef<HTMLElement>>('htmlPre');
  private tsPreEl = viewChild<ElementRef<HTMLElement>>('tsPre');
  private previewScrollable = signal(false);
  private htmlCodeScrollable = signal(false);
  private tsCodeScrollable = signal(false);
  // Only focusable when its content actually overflows and needs scrolling.
  previewTabIndex = computed(() => (this.previewScrollable() ? 0 : -1));
  htmlCodeTabIndex = computed(() => (this.htmlCodeScrollable() ? 0 : -1));
  tsCodeTabIndex = computed(() => (this.tsCodeScrollable() ? 0 : -1));

  constructor() {
    this._observeScrollable(this.previewEl, this.previewScrollable);
    this._observeScrollable(this.htmlPreEl, this.htmlCodeScrollable);
    this._observeScrollable(this.tsPreEl, this.tsCodeScrollable);

    effect(() => {
      const htmlCode = this.htmlCode();
      const tsCode = this.tsCode();

      if (!htmlCode && !tsCode) {
        this.logger.warn(
          'At least one of htmlCode or tsCode must be provided',
          {
            context: 'CodeExampleComponent',
            metadata: { instanceId: this.instanceId, label: this.label() }
          }
        );
      }

      const availableTabs: TabId[] = this.previewOutside() ? [] : ['preview'];

      if (htmlCode) {
        const htmlResult = hljs.highlight(htmlCode.trim(), { language: 'xml' });
        this.highlightedCode.set(
          this.sanitizer.bypassSecurityTrustHtml(htmlResult.value)
        );
        availableTabs.push('html');
      }

      if (tsCode) {
        const tsResult = hljs.highlight(tsCode.trim(), {
          language: 'typescript'
        });
        this.highlightedTsCode.set(
          this.sanitizer.bypassSecurityTrustHtml(tsResult.value)
        );
        availableTabs.push('ts');
      }

      this.tabs.set(availableTabs);

      if (!this.tabs().includes(this.activeTab())) {
        this.activeTab.set(availableTabs[0] ?? 'preview');
      }
    });
  }

  private _observeScrollable(
    elRef: Signal<ElementRef<HTMLElement> | undefined>,
    scrollable: WritableSignal<boolean>
  ): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    effect((onCleanup) => {
      const el = elRef()?.nativeElement;
      if (!el) {
        scrollable.set(false);
        return;
      }

      const update = () => scrollable.set(el.scrollWidth > el.clientWidth);
      update();

      const observer = new ResizeObserver(update);
      observer.observe(el);
      onCleanup(() => observer.disconnect());
    });
  }

  async copyCode(): Promise<void> {
    let textToCopy = '';

    if (this.activeTab() === 'ts') {
      textToCopy = (this.tsCode() ?? '').trim();
    } else if (this.activeTab() === 'html') {
      textToCopy = (this.htmlCode() ?? '').trim();
    }

    try {
      await navigator.clipboard.writeText(textToCopy);
      this.copied.set(true);
      this.appTelemetry.trackClick('code_copied', {
        language: this.activeTab()
      });
      setTimeout(() => this.copied.set(false), 2000);
    } catch (error) {
      this.copyFailed.set(true);
      this.logger.warn('Failed to copy code to clipboard', {
        context: 'CodeExample',
        error
      });
      setTimeout(() => this.copyFailed.set(false), 2000);
    }
  }

  navigateTabs(event: KeyboardEvent): void {
    const tabs = this.tabs();
    const current = tabs.indexOf(this.activeTab());
    let next = current;

    if (event.key === 'ArrowRight') {
      next = (current + 1) % tabs.length;
    } else if (event.key === 'ArrowLeft') {
      next = (current - 1 + tabs.length) % tabs.length;
    } else if (event.key === 'Home') {
      next = 0;
    } else if (event.key === 'End') {
      next = tabs.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    this.activeTab.set(tabs[next]);
    document.getElementById(`${this.instanceId}-tab-${tabs[next]}`)?.focus();
  }
}
