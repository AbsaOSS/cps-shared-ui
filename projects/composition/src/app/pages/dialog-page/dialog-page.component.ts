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
  ref: CpsDialogRef | undefined;

  // eslint-disable-next-line no-useless-constructor
  constructor(public dialogService: CpsDialogService) {}

  toggleDialog() {
    this.ref = this.dialogService.open(ConfirmationComponent, {
      // header: 'Select a Product',
      // width: '70%',
      // showHeader: false,
      contentStyle: { overflow: 'auto' },
      baseZIndex: 10000,
      maximizable: true,
      modal: true,
      dismissableMask: true,
      data: {
        subtitle: 'Hello dialog'
      }
    } as CpsDialogConfig);

    this.ref.onClose.subscribe((confirm: boolean) => {});

    this.ref.onMaximize.subscribe((value) => {});
  }

  ngOnDestroy() {
    if (this.ref) {
      this.ref.close();
    }
  }
}
