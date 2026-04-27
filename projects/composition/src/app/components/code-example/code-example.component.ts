import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import hljs from 'highlight.js/lib/core';
import xml from 'highlight.js/lib/languages/xml';

hljs.registerLanguage('xml', xml);

@Component({
  selector: 'app-code-example',
  templateUrl: './code-example.component.html',
  styleUrl: './code-example.component.scss'
})
export class CodeExampleComponent implements OnInit {
  @Input({ required: true }) code = '';
  @Input() label = '';

  private sanitizer = inject(DomSanitizer);

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
}
