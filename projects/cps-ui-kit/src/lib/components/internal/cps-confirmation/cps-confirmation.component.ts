import { Component, OnInit } from '@angular/core';
import { CpsButtonComponent } from '../../cps-button/cps-button.component';
import { CpsIconComponent } from '../../cps-icon/cps-icon.component';
import { CpsDialogConfig } from '../../cps-dialog/cps-dialog-config';
import { CpsDialogRef } from '../../cps-dialog/cps-dialog-ref';

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
