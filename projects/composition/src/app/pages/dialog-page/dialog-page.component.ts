import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CpsButtonComponent, CpsDialogService } from 'cps-ui-kit';
import { DialogContentComponent } from '../../components/dialog-content/dialog-content.component';
import { ServiceDocsViewerComponent } from '../../components/service-docs-viewer/service-docs-viewer.component';

import ServiceData from '../../api-data/cps-dialog.json';

@Component({
  selector: 'app-dialog-page',
  standalone: true,
  imports: [CommonModule, CpsButtonComponent, ServiceDocsViewerComponent],
  templateUrl: './dialog-page.component.html',
  styleUrls: ['./dialog-page.component.scss'],
  host: { class: 'composition-page' }
})
export class DialogPageComponent {
  serviceData = ServiceData;
  // eslint-disable-next-line no-useless-constructor
  constructor(private _dialogService: CpsDialogService) {}

  openConfirmationDialog() {
    const dialogRef = this._dialogService.openConfirmationDialog({
      data: {
        subtitle: 'Are you really sure you want to break the law?'
      }
    });

    dialogRef.onClose.subscribe((result: boolean) => {
      console.log(result);
    });
  }

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
  }

  openBlurredBgDialog() {
    this._dialogService.open(DialogContentComponent, {
      headerTitle: 'Dialog with blurred background',
      blurredBackground: true,
      data: {
        info: 'Greetings from the dialog content component',
        icon: 'like'
      }
    });
  }

  openDraggableDialog() {
    const dialogRef = this._dialogService.open(DialogContentComponent, {
      headerTitle: 'Draggable dialog',
      minWidth: '600px',
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
  }

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
  }

  openResizableDialog() {
    const dialogRef = this._dialogService.open(DialogContentComponent, {
      headerTitle: 'Resizable dialog',
      minWidth: '200px',
      minHeight: '200px',
      maxWidth: '800px',
      maxHeight: '800px',
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
  }

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
  }

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
  }
}
