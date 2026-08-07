export const schedulerExamples: Record<string, { html: string; ts?: string }> =
  {
    basicUsage: {
      html: `
<cps-scheduler
  label="Frequency"
  [disabled]="false"
  [(cron)]="cronExpression"
  (cronChange)="onCronExpressionChanged($event)"
  [(timeZone)]="timeZone"
  (timeZoneChange)="onTimezoneChanged($event)"
  [showAdvanced]="true"
  [use24HourTime]="true"
  [showNotSet]="true"
  [showTimeZone]="true"
  infoTooltip="Provide frequency"></cps-scheduler>`,
      ts: `
cronExpression = '30 9 ? 7/4 WED#5 *';
timeZone = 'UTC';

onCronExpressionChanged(cron: string) {
  console.log('CRON expression', cron);
}

onTimezoneChanged(tz: string) {
  console.log('Time zone', tz);
}`
    }
  };
