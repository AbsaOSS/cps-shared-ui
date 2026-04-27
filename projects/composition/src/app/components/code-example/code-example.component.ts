import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CpsButtonComponent } from 'cps-ui-kit';
import hljs from 'highlight.js/lib/core';
import xml from 'highlight.js/lib/languages/xml';

hljs.registerLanguage('xml', xml);

@Component({
  imports: [CpsButtonComponent],
  selector: 'app-code-example',
  templateUrl: './code-example.component.html',
  styleUrl: './code-example.component.scss'
})
export class CodeExampleComponent implements OnInit {
  private static instanceCount = 0;

  @Input({ required: true }) code = '';
  @Input() label = '';

  private sanitizer = inject(DomSanitizer);

  instanceId = `code-example-${++CodeExampleComponent.instanceCount}`;
  activeTab = signal<'preview' | 'code'>('preview');
  copied = signal(false);
  highlightedCode: SafeHtml = '';

  ngOnInit(): void {
    const result = hljs.highlight(this.code.trim(), { language: 'xml' });
    this.highlightedCode = this.sanitizer.bypassSecurityTrustHtml(result.value);
  }

  copyCode(): void {
    navigator.clipboard.writeText(this.code.trim());
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }

  navigateTabs(event: KeyboardEvent): void {
    const tabs: Array<'preview' | 'code'> = ['preview', 'code'];
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
