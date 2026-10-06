import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal
} from '@angular/core';
import { CpsButtonComponent } from 'cps-ui-kit';
import { uwtSafeStringify } from '../uwt-diagnostics-export/uwt-diagnostics-export';
import { UWT_DEFAULT_DIAGNOSTICS_CONFIG } from '../uwt-diagnostics-store/uwt-diagnostics-store';

/** Characters shown of a payload too large to show in full. */
const TRUNCATED_VIEW_CHARS = 64 * 1024;

/**
 * The first `length` characters of `text`, one fewer if the cut would split
 * a surrogate pair — half an emoji renders as a replacement character.
 */
function cutAt(text: string, length: number): string {
  const last = text.charCodeAt(length - 1);
  const isHighSurrogate = last >= 0xd800 && last <= 0xdbff;
  return text.slice(0, isHighSurrogate ? length - 1 : length);
}

/**
 * A payload as indented JSON, with a copy button.
 *
 * The only piece of the popup not taken from cps-ui-kit, which has no code
 * or JSON display. It uses the kit's colour and radius tokens.
 */
@Component({
  selector: 'uwt-diagnostics-json',
  imports: [CpsButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './uwt-diagnostics-json.component.html',
  styleUrl: './uwt-diagnostics-json.component.scss'
})
export class UwtDiagnosticsJsonComponent {
  /** What to show. */
  readonly value = input.required<unknown>();

  /** Accessible name of the scrollable block. */
  readonly label = input('Event payload');

  /** JSON length, in characters, above which the view is truncated. */
  readonly maxChars = input(
    UWT_DEFAULT_DIAGNOSTICS_CONFIG.maxPayloadCharsInView
  );

  /** How much a truncated view shows, as the notice words it. */
  protected readonly shownChars = TRUNCATED_VIEW_CHARS.toLocaleString('en-US');

  protected readonly copied = signal<'idle' | 'copied' | 'failed'>('idle');

  protected readonly full = computed(() => {
    try {
      return uwtSafeStringify(this.value(), 2) ?? 'undefined';
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
    this.truncated() ? cutAt(this.full(), TRUNCATED_VIEW_CHARS) : this.full()
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
