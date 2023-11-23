import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CpsButtonComponent,
  CpsDialogConfig,
  CpsDialogRef,
  CpsDialogService
} from 'cps-ui-kit';
import { ConfirmationComponent } from '../../components/confirmation/confirmation.component';

@Component({
  selector: 'app-dialog-page',
  standalone: true,
  imports: [CommonModule, CpsButtonComponent],
  templateUrl: './dialog-page.component.html',
  styleUrls: ['./dialog-page.component.scss'],
  providers: [CpsDialogService],
  host: { class: 'composition-page' }
})
export class DialogPageComponent {
  dialogRef: CpsDialogRef | undefined;
  confDialogRef: CpsDialogRef | undefined;

  // eslint-disable-next-line no-useless-constructor
  constructor(public dialogService: CpsDialogService) {}

  openDialog() {
    this.dialogRef = this.dialogService.open(ConfirmationComponent, {
      headerTitle: 'Select a Product',
      // minWidth: '500px',
      maxWidth: '1000px',
      width: '1500px',
      // width: '70%',
      // height: '70%',
      // showHeader: false,
      // contentStyle: { overflow: 'auto' },
      // baseZIndex: 10000,
      headerIcon: 'avatar',
      showHeaderLeftBorder: false,
      showHeaderBottomBorder: false,
      modal: true,
      keepInViewport: true,
      // minX: 100,
      // minY: 200,
      maximized: true,
      maximizable: true,
      // closeOnEscape: false,
      // showCloseBtn: true,
      // disableClose: false,
      // headerIconColor: 'green',
      headerInfoTooltip: 'This is a tooltip',
      headerInfoTooltipPosition: 'bottom',
      draggable: true,
      // disableClose: true,
      resizable: true,
      data: {
        subtitle: 'Hello dialog'
      }
    } as CpsDialogConfig);

    this.dialogRef.onClose.subscribe((confirm: boolean) => {});

    this.dialogRef.onMaximize.subscribe((value) => {});
  }

  openConfirmationDialog() {
    this.confDialogRef = this.dialogService.openConfirmationDialog({
      data: {
        subtitle: 'Are you really sure you want to break the law?'
      }
    } as CpsDialogConfig);

    this.confDialogRef.onClose.subscribe((confirm: boolean) => {
      console.log(confirm);
    });
    this.confDialogRef.onOpen.subscribe(() => {
      console.log('onOpen');
    });
  }

  ngOnDestroy() {
    this.dialogRef?.close();
    this.confDialogRef?.close();
  }
}
