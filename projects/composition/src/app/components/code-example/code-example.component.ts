import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CpsButtonComponent } from 'cps-ui-kit';
import hljs from 'highlight.js/lib/core';
import xml from 'highlight.js/lib/languages/xml';
import typescript from 'highlight.js/lib/languages/typescript';

hljs.registerLanguage('xml', xml);
hljs.registerLanguage('typescript', typescript);

type TabId = 'preview' | 'code' | 'ts';

@Component({
  imports: [CpsButtonComponent],
  selector: 'app-code-example',
  templateUrl: './code-example.component.html',
  styleUrl: './code-example.component.scss'
})
export class CodeExampleComponent implements OnInit {
  private static instanceCount = 0;

  @Input({ required: true }) code = '';
  @Input() tsCode: string | undefined;
  @Input() label = '';

  private sanitizer = inject(DomSanitizer);

  instanceId = `code-example-${++CodeExampleComponent.instanceCount}`;
  activeTab = signal<TabId>('preview');
  copied = signal(false);
  copyFailed = signal(false);
  highlightedCode: SafeHtml = '';
  highlightedTsCode: SafeHtml = '';

  private tabs: TabId[] = ['preview', 'code'];

  ngOnInit(): void {
    const htmlResult = hljs.highlight(this.code.trim(), { language: 'xml' });
    this.highlightedCode = this.sanitizer.bypassSecurityTrustHtml(
      htmlResult.value
    );

    if (this.tsCode) {
      const tsResult = hljs.highlight(this.tsCode.trim(), {
        language: 'typescript'
      });
      this.highlightedTsCode = this.sanitizer.bypassSecurityTrustHtml(
        tsResult.value
      );
      this.tabs = ['preview', 'code', 'ts'];
    }
  }

  async copyCode(): Promise<void> {
    const textToCopy =
      this.activeTab() === 'ts' ? (this.tsCode ?? '').trim() : this.code.trim();
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
    const tabs = this.tabs;
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
