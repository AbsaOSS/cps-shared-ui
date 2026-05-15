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
    label="Closable chip"
    [closable]="true"
    (closed)="onToggleChip()"></cps-chip>
}
@if (chipClosed) {
  <cps-button
    label="Reset chip"
    (clicked)="onToggleChip()"
    size="xsmall"></cps-button>
}`,
    ts: `
chipClosed = false;

onToggleChip(): void {
  this.chipClosed = !this.chipClosed;
}`
  }
};
