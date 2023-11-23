import { Component, OnInit } from '@angular/core';
import {
  CpsButtonComponent,
  CpsDialogConfig,
  CpsDialogRef,
  CpsIconComponent
} from 'cps-ui-kit';

@Component({
  standalone: true,
  imports: [CpsButtonComponent, CpsIconComponent],
  selector: 'app-confirmation',
  templateUrl: './confirmation.component.html',
  styleUrls: ['./confirmation.component.scss']
})
export class ConfirmationComponent implements OnInit {
  subtitle = '';

  closeDisabled = false;

  // eslint-disable-next-line no-useless-constructor
  constructor(
    private _dialogRef: CpsDialogRef,
    private _config: CpsDialogConfig
  ) {
    this.subtitle = this._config.data.subtitle;
  }

  ngOnInit(): void {
    this.closeDisabled = !!this._dialogRef.disableClose;
  }

  close(confirm: boolean) {
    this._dialogRef.close(confirm);
  }

  toggleDisableClose() {
    this.closeDisabled = !this.closeDisabled;
    this._dialogRef.disableClose = this.closeDisabled;
  }
}
