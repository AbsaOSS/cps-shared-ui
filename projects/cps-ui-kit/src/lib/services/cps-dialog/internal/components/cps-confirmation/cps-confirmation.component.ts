import { Component, OnInit } from '@angular/core';
import { CpsButtonComponent } from '../../../../../components/cps-button/cps-button.component';
import { CpsIconComponent } from '../../../../../components/cps-icon/cps-icon.component';
import { CpsDialogRef } from '../../../utils/cps-dialog-ref';
import { CpsDialogConfig } from '../../../utils/cps-dialog-config';

@Component({
  standalone: true,
  imports: [CpsButtonComponent, CpsIconComponent],
  selector: 'cps-confirmation',
  templateUrl: './cps-confirmation.component.html',
  styleUrls: ['./cps-confirmation.component.scss']
})
export class CpsConfirmationComponent implements OnInit {
  subtitle = '';

  // eslint-disable-next-line no-useless-constructor
  constructor(
    private _dialogRef: CpsDialogRef,
    public config: CpsDialogConfig
  ) {
    this.subtitle = config.data.subtitle;
  }

  ngOnInit(): void {}

  close(confirm: boolean) {
    this._dialogRef.close(confirm);
  }
}
