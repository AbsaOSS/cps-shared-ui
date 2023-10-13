import { Component, OnInit } from '@angular/core';
import { CpsButtonComponent, CpsIconComponent } from 'cps-ui-kit';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  standalone: true,
  imports: [CpsButtonComponent, CpsIconComponent],
  selector: 'cps-confirmation',
  templateUrl: './confirmation.component.html',
  styleUrls: ['./confirmation.component.scss']
})
export class ConfirmationComponent implements OnInit {
  subtitle = '';

  // eslint-disable-next-line no-useless-constructor
  constructor(
    private _dialogRef: DynamicDialogRef,
    public config: DynamicDialogConfig
  ) {
    this.subtitle = config.data.subtitle;
  }

  ngOnInit(): void {}

  close(confirm: boolean) {
    this._dialogRef.close(confirm);
  }
}
