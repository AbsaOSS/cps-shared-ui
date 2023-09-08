import { CommonModule } from '@angular/common';
import { Component, Inject, Input, OnInit, Optional } from '@angular/core';
import {
  CPS_RADIO_GROUP,
  CpsRadioGroupComponent,
  RadioOption
} from '../cps-radio-group.component';
import { CpsTooltipDirective } from '../../../directives/cps-tooltip.directive';
import { CpsRadioButtonComponent } from '../cps-radio-button/cps-radio-button.component';

@Component({
  standalone: true,
  selector: 'cps-radio',
  imports: [
    CommonModule,
    CpsTooltipDirective,
    CpsRadioGroupComponent,
    CpsRadioButtonComponent
  ],
  templateUrl: './cps-radio.component.html',
  styleUrls: ['./cps-radio.component.scss']
})
export class CpsRadioComponent implements OnInit {
  @Input() option!: RadioOption;
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

  updateValueEvent(event: Event): void {
    this.radioGroup?.updateValueEvent(event);
  }
}