import { Component, Input } from '@angular/core';
import { EnumsAPI } from '../../../models/component-api.model';
import { EnumValuesPipe } from './enum-values.pipe';
import { CpsTooltipDirective } from 'cps-ui-kit';

@Component({
  selector: 'app-enums',
  templateUrl: './enums.component.html',
  styleUrl: './enums.component.scss',
  imports: [EnumValuesPipe, CpsTooltipDirective],
  standalone: true
})
export class EnumsComponent {
  @Input() enums?: EnumsAPI;
}
