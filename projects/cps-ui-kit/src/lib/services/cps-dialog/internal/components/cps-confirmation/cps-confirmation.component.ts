import { Component, Inject } from '@angular/core';
import { CpsButtonComponent } from '../../../../../components/cps-button/cps-button.component';
import { CpsDialogRef } from '../../../utils/cps-dialog-ref';
import {
  CPS_DIALOG_CONFIG,
  type CpsDialogConfig
} from '../../../utils/cps-dialog-config';

@Component({
  imports: [CpsButtonComponent],
  selector: 'cps-confirmation',
  templateUrl: './cps-confirmation.component.html',
  styleUrls: ['./cps-confirmation.component.scss']
})
export class CpsConfirmationComponent {
  subtitle = '';

  constructor(
    private _dialogRef: CpsDialogRef,
    @Inject(CPS_DIALOG_CONFIG) private _config: CpsDialogConfig
  ) {
    this.subtitle = this._config.data?.subtitle;
  }

  close(confirm: boolean) {
    this._dialogRef?.close(confirm);
  }
}
