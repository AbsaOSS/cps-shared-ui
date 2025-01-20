import { CommonModule } from '@angular/common';
import { Component, Inject, Input, OnInit, Optional } from '@angular/core';
import {
  CPS_RADIO_GROUP,
  CpsRadioGroupComponent,
  CpsRadioOption
} from '../cps-radio-group.component';
import { CpsRadioButtonComponent } from '../cps-radio-button/cps-radio-button.component';

/**
 * CpsRadioComponent is a radio button with arbitrary content.
 * @group Components
 */
@Component({
  selector: 'cps-radio',
  imports: [
    CommonModule,
    CpsRadioButtonComponent
  ],
  templateUrl: './cps-radio.component.html',
  styleUrls: ['./cps-radio.component.scss']
})
export class CpsRadioComponent implements OnInit {
  /**
   * An option.
   * @group Props
   */
  @Input() option!: CpsRadioOption;

  radioGroup?: CpsRadioGroupComponent;
  groupDisabled = false;

  constructor(
    @Optional() @Inject(CPS_RADIO_GROUP) radioGroup: CpsRadioGroupComponent
  ) {
    this.radioGroup = radioGroup;
  }

  ngOnInit(): void {
    this.groupDisabled = this.radioGroup?.disabled ?? false;
  }

  updateValueEvent(value: any): void {
    this.radioGroup?.updateValueEvent(value);
  }
}
