import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { EnumsAPI } from '../../../models/component-api.model';
import { EnumValuesPipe } from './enum-values.pipe';

@Component({
  selector: 'app-enums',
  templateUrl: './enums.component.html',
  styleUrl: './enums.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [EnumValuesPipe]
})
export class EnumsComponent {
  @Input() enums?: EnumsAPI;
}
