import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DetectTypePipe } from '../../../pipes/detect-type.pipe';

@Component({
  selector: 'app-api-type',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DetectTypePipe, RouterLink],
  templateUrl: './api-type.component.html',
  styleUrl: './api-type.component.scss'
})
export class ApiTypeComponent {
  readonly type = input<string>('');
  readonly typesMap = input<Record<string, string>>({});
}
