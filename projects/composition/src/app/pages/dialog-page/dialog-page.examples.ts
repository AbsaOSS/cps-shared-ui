export const dialogExamples: Record<string, { html: string; ts?: string }> = {
  confirmationDialog: {
    html: `
<cps-button
  label="Confirmation dialog"
  (clicked)="openConfirmationDialog()"></cps-button>`,
    ts: `
// inject(CpsDialogService) used here

openConfirmationDialog() {
  const dialogRef = this._dialogService.openConfirmationDialog({
    data: {
      subtitle: 'Are you really sure you want to <u>break the law?</u>'
    }
  });

  dialogRef.onClose.subscribe((result: boolean) => {
    console.log(result);
  });
}`
  },

  regularDialog: {
    html: `
<cps-button label="Regular dialog" (clicked)="openDialog()"></cps-button>`,
    ts: `
// DialogContentComponent is a custom component rendered inside the dialog

openDialog() {
  const dialogRef = this._dialogService.open(DialogContentComponent, {
    headerTitle: 'Regular dialog',
    data: {
      info: 'Greetings from the dialog content component',
      icon: 'like'
    }
  });

  dialogRef.onOpen.subscribe(() => {
    console.log('opened');
  });

  dialogRef.onClose.subscribe((res: any) => {
    console.log('closed', res);
  });

  dialogRef.onDestroy.subscribe(() => {
    console.log('destroy');
  });
}`
  },

  blurredBackgroundDialog: {
    html: `
<cps-button
  label="Dialog with blurred background and container autofocus"
  (clicked)="openBlurredBgDialog()"></cps-button>`,
    ts: `
openBlurredBgDialog() {
  this._dialogService.open(DialogContentComponent, {
    autoFocus: 'dialog',
    headerTitle: 'Dialog with blurred background',
    blurredBackground: true,
    data: {
      info: 'Greetings from the dialog content component',
      icon: 'like'
    }
  });
}`
  },

  draggableDialog: {
    html: `
<cps-button
  label="Draggable dialog"
  (clicked)="openDraggableDialog()"></cps-button>`,
    ts: `
openDraggableDialog() {
  const dialogRef = this._dialogService.open(DialogContentComponent, {
    headerTitle: 'Draggable dialog',
    minWidth: '37.5rem',
    showHeaderLeftBorder: false,
    draggable: true,
    data: {
      info: 'Greetings from the dialog content component',
      icon: 'like'
    }
  });

  dialogRef.onDragStart.subscribe((event) => {
    console.log('onDragStart', event);
  });

  dialogRef.onDragEnd.subscribe((event) => {
    console.log('onDragEnd', event);
  });
}`
  },

  maximizableDialog: {
    html: `
<cps-button
  label="Maximizable dialog"
  (clicked)="openMaximizableDialog()"></cps-button>`,
    ts: `
openMaximizableDialog() {
  const dialogRef = this._dialogService.open(DialogContentComponent, {
    headerTitle: 'Maximizable dialog',
    headerIcon: 'toast-success',
    headerIconColor: 'success',
    maximizable: true,
    data: {
      info: 'Greetings from the dialog content component',
      icon: 'like'
    }
  });

  dialogRef.onMaximize.subscribe((value) => {
    console.log('onMaximize', value);
  });
}`
  },

  resizableDialog: {
    html: `
<cps-button
  label="Resizable dialog"
  (clicked)="openResizableDialog()"></cps-button>`,
    ts: `
openResizableDialog() {
  const dialogRef = this._dialogService.open(DialogContentComponent, {
    headerTitle: 'Resizable dialog',
    minWidth: '12.5rem',
    minHeight: '12.5rem',
    maxWidth: '50rem',
    maxHeight: '50rem',
    showHeaderLeftBorder: false,
    showHeaderBottomBorder: false,
    showCloseBtn: false,
    headerInfoTooltip: 'Drag left bottom corner to resize',
    headerInfoTooltipPosition: 'bottom',
    resizable: true,
    data: {
      info: 'Greetings from the dialog content component',
      icon: 'like'
    }
  });

  dialogRef.onResizeStart.subscribe((event) => {
    console.log('onResizeStart', event);
  });

  dialogRef.onResizeEnd.subscribe((event) => {
    console.log('onResizeEnd', event);
  });
}`
  },

  nonModalDialog: {
    html: `
<cps-button
  label="Non-modal dialog"
  (clicked)="openNonModalDialog()"></cps-button>`,
    ts: `
openNonModalDialog() {
  this._dialogService.open(DialogContentComponent, {
    headerTitle: 'Non-modal dialog',
    headerInfoTooltip: 'I am non-modal',
    modal: false,
    data: {
      info: 'Greetings from the dialog content component',
      icon: 'like'
    }
  });
}`
  },

  bottomRightPositionedDialog: {
    html: `
<cps-button
  label="Bottom-right positioned dialog"
  (clicked)="openBottomRightPositionedDialog()"></cps-button>`,
    ts: `
openBottomRightPositionedDialog() {
  this._dialogService.open(DialogContentComponent, {
    headerTitle: 'Bottom-right positioned dialog',
    position: 'bottom-right',
    modal: false,
    data: {
      info: 'Greetings from the dialog content component',
      icon: 'like'
    }
  });
}`
  },

  topLeftPositionedFromRootInstance: {
    html: `
<cps-button
  label="Top-left positioned dialog opened from the root instance"
  (clicked)="openDialogFromRootInstance()"></cps-button>`,
    ts: `
// inject(CpsDialogService) with @SkipSelf() used here to get the root instance

openDialogFromRootInstance() {
  this._dialogServiceRoot.open(DialogContentComponent, {
    headerTitle: 'Top-left positioned dialog opened from root instance',
    position: 'top-left',
    modal: false,
    data: {
      info: 'Greetings from the dialog content component opened from root instance',
      icon: 'like'
    }
  });
}`
  },

  closeAllDialogs: {
    html: `
<div style="display: flex; flex-wrap: wrap; gap: 0.75rem;">
  <cps-button
    label="Close all dialogs"
    icon="close-x"
    type="outlined"
    (clicked)="closeAllDialogs()">
  </cps-button>
  <cps-button
    label="Close all dialogs (forced)"
    icon="close-x"
    type="outlined"
    (clicked)="closeAllDialogs(true)">
  </cps-button>
</div>`,
    ts: `
closeAllDialogs(force = false): void {
  this._dialogService.closeAll(force);
}`
  }
};
