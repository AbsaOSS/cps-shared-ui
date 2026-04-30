import {
  Component,
  effect,
  input,
  inject,
  signal,
  ChangeDetectionStrategy,
  computed
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CpsButtonComponent } from 'cps-ui-kit';
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
  isPreviewNonInteractive = input(false);

  private sanitizer = inject(DomSanitizer);

  instanceId = `code-example-${++CodeExampleComponent.instanceCount}`;
  activeTab = signal<TabId>('preview');
  copied = signal(false);
  copyFailed = signal(false);
  highlightedCode = signal<SafeHtml>('');
  highlightedTsCode = signal<SafeHtml>('');
  tabs = signal<TabId[]>(['preview']);
  previewTabIndex = computed(() => (this.isPreviewNonInteractive() ? 0 : -1));

  constructor() {
    effect(() => {
      const htmlCode = this.htmlCode();
      const tsCode = this.tsCode();

      if (!htmlCode && !tsCode) {
        console.warn(
          'CodeExampleComponent: At least one of htmlCode or tsCode must be provided'
        );
      }

      const availableTabs: TabId[] = ['preview'];

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
        this.activeTab.set('preview');
      }
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
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      this.copyFailed.set(true);
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
