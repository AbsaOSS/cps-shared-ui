export const chipExamples: Record<string, { html: string; ts?: string }> = {
  basic: {
    html: `
<cps-chip label="Basic chip"></cps-chip>
<cps-chip label="Disabled chip" [disabled]="true"></cps-chip>`
  },

  withIcon: {
    html: `
<!-- Icon before label (default) -->
<cps-chip label="Left icon chip" icon="checked"></cps-chip>

<!-- Icon after label -->
<cps-chip label="Right icon chip" icon="checked" iconPosition="after"></cps-chip>

<!-- Colored icon -->
<cps-chip label="Chip with colored icon" icon="avatar" iconColor="success"></cps-chip>

<!-- Disabled with icon -->
<cps-chip label="Disabled chip" icon="eye" [disabled]="true"></cps-chip>`
  },

  closable: {
    html: `
@if (!chipClosed) {
  <cps-chip
    #closableChipRef
    label="Closable chip"
    [closable]="true"
    (closed)="onToggleChip()"></cps-chip>
}
@if (chipClosed) {
  <cps-button
    #resetChipBtnRef
    label="Reset chip"
    (clicked)="onToggleChip()"
    size="xsmall"></cps-button>
}
<cps-chip
  label="Closable chip with custom close label"
  [closable]="true"
  closeButtonAriaLabel="Dismiss"
  (closed)="onDismissChip()">
</cps-chip>
<cps-chip
  label="Disabled closable chip"
  [disabled]="true"
  [closable]="true"></cps-chip>`,
    ts: `
private readonly _notifService = inject(CpsNotificationService);
private readonly _focusService = inject(CpsFocusService);

@ViewChild('closableChipRef', { read: ElementRef })
closableChipRef?: ElementRef<HTMLElement>;

@ViewChild('resetChipBtnRef', { read: ElementRef })
resetChipBtnRef?: ElementRef<HTMLElement>;

chipClosed = false;

onToggleChip(): void {
  this.chipClosed = !this.chipClosed;

  setTimeout(() => {
    const el = this.chipClosed
      ? this.resetChipBtnRef?.nativeElement.querySelector<HTMLElement>('button')
      : this.closableChipRef?.nativeElement.querySelector<HTMLElement>('.cps-chip-close-btn');

    if (el) {
      this._focusService.focusElement(el, this._focusService.isKeyboard());
    }
  });
}

onDismissChip(): void {
  this._notifService.info('Chip dismissed');
}`
  }
};
