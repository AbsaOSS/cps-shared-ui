const notifServiceTs = `private readonly _notifService = inject(CpsNotificationService);`;

export const notificationExamples: Record<
  string,
  { html: string; ts?: string }
> = {
  infoNotification: {
    html: `
<cps-button
  label="Info notification"
  icon="toast-info"
  color="calm"
  (clicked)="showInfoNotification()"></cps-button>`,
    ts: `
${notifServiceTs}

counter = 0;

showInfoNotification() {
  this._notifService.info(\`Notification message \${this.counter}\`);
  this.counter += 1;
}`
  },

  errorNotification: {
    html: `
<cps-button
  label="Error notification"
  icon="toast-error"
  color="calm"
  (clicked)="showErrorNotification()"></cps-button>`,
    ts: `
${notifServiceTs}

counter = 0;

showErrorNotification() {
  this._notifService.error(\`Notification message \${this.counter}\`);
  this.counter += 1;
}`
  },

  successNotification: {
    html: `
<cps-button
  label="Success notification"
  icon="toast-success"
  color="calm"
  (clicked)="showSuccessNotification()"></cps-button>`,
    ts: `
${notifServiceTs}

counter = 0;

showSuccessNotification() {
  this._notifService.success(\`Notification message \${this.counter}\`);
  this.counter += 1;
}`
  },

  warningNotification: {
    html: `
<cps-button
  label="Warning notification"
  icon="toast-warning"
  color="calm"
  (clicked)="showWarningNotification()"></cps-button>`,
    ts: `
${notifServiceTs}

counter = 0;

showWarningNotification() {
  this._notifService.warning(\`Notification message \${this.counter}\`);
  this.counter += 1;
}`
  },

  infoNotificationWithDetails: {
    html: `
<cps-button
  label="Bottom info notification with details"
  icon="toast-info"
  color="calm"
  (clicked)="showInfoNotificationWithDetails()"></cps-button>`,
    ts: `
${notifServiceTs}

counter = 0;

showInfoNotificationWithDetails() {
  this._notifService.info(
    \`Notification message \${this.counter}\`,
    'Notification details',
    { position: CpsNotificationPosition.BOTTOM }
  );
  this.counter += 1;
}`
  },

  errorRightMax3Notification: {
    html: `
<cps-button
  label="Right error notification with max 3 in a column"
  icon="toast-error"
  color="calm"
  (clicked)="showErrorRightWithMax3Notification()"></cps-button>`,
    ts: `
${notifServiceTs}

counter = 0;

showErrorRightWithMax3Notification() {
  this._notifService.error(
    \`Notification message \${this.counter}\`,
    'Http failure response for https://my-long-url/epic/fail: 404 Not Found Error',
    {
      position: CpsNotificationPosition.RIGHT,
      maxWidth: '28rem',
      maxAmount: 3
    }
  );
  this.counter += 1;
}`
  },

  bottomLeftPersistentOutlinedSuccessNotification: {
    html: `
<cps-button
  label="Bottom-left persistent outlined success notification"
  icon="toast-success"
  color="calm"
  (clicked)="showOutlinedBottomLeftPersistentSuccessNotification()"></cps-button>`,
    ts: `
${notifServiceTs}

counter = 0;

showOutlinedBottomLeftPersistentSuccessNotification() {
  this._notifService.success(\`Notification message \${this.counter}\`, '', {
    timeout: 0,
    position: CpsNotificationPosition.BOTTOMLEFT,
    appearance: CpsNotificationAppearance.OUTLINED
  });
  this.counter += 1;
}`
  },

  bottomRightOutlinedWarningNotification: {
    html: `
<cps-button
  label="Bottom-right outlined warning notification with 2-seconds timeout"
  icon="toast-warning"
  color="calm"
  (clicked)="showOutlinedBottomRight2sTimeoutWarningNotification()"></cps-button>`,
    ts: `
${notifServiceTs}

counter = 0;

showOutlinedBottomRight2sTimeoutWarningNotification() {
  this._notifService.warning(
    \`Notification message \${this.counter}\`,
    'Notification details',
    {
      timeout: 2000,
      position: CpsNotificationPosition.BOTTOMRIGHT,
      appearance: CpsNotificationAppearance.OUTLINED
    }
  );
  this.counter += 1;
}`
  },

  clearAllNotifications: {
    html: `
<cps-button
  label="Clear all notifications"
  icon="remove"
  type="outlined"
  (clicked)="clearNotifications()">
</cps-button>`,
    ts: `
${notifServiceTs}

clearNotifications(): void {
  this._notifService.clear();
}`
  }
};
