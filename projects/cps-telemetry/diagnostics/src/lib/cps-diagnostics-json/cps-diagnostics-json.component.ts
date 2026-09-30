import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal
} from '@angular/core';
import { CpsButtonComponent } from 'cps-ui-kit';
import { cpsSafeStringify } from '../cps-diagnostics-export/cps-diagnostics-export';

/** Characters shown of a payload too large to show in full. */
const TRUNCATED_VIEW_CHARS = 64 * 1024;

/**
 * A payload as indented JSON, with a copy button.
 *
 * The only piece of the popup not taken from cps-ui-kit, which has no code
 * or JSON display. It uses the kit's colour and radius tokens.
 */
@Component({
  selector: 'cps-diagnostics-json',
  imports: [CpsButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cps-diagnostics-json.component.html',
  styleUrl: './cps-diagnostics-json.component.scss'
})
export class CpsDiagnosticsJsonComponent {
  /** What to show. */
  readonly value = input.required<unknown>();

  /** Accessible name of the scrollable block. */
  readonly label = input('Event payload');

  /** Serialized size above which the view is truncated. */
  readonly maxChars = input(256 * 1024);

  protected readonly copied = signal<'idle' | 'copied' | 'failed'>('idle');

  protected readonly full = computed(() => {
    try {
      return cpsSafeStringify(this.value(), 2) ?? 'undefined';
    } catch (error) {
      return `Couldn't render this payload: ${
        error instanceof Error ? error.message : String(error)
      }`;
    }
  });

  protected readonly truncated = computed(
    () => this.full().length > this.maxChars()
  );

  protected readonly shown = computed(() =>
    this.truncated() ? this.full().slice(0, TRUNCATED_VIEW_CHARS) : this.full()
  );

  protected async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.full());
      this.copied.set('copied');
    } catch {
      this.copied.set('failed');
    }
    setTimeout(() => this.copied.set('idle'), 2000);
  }
}
