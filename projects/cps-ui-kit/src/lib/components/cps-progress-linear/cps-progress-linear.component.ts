import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { convertSize } from '../../utils/size-utils';
import { getCSSColor } from '../../utils/colors-utils';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'cps-progress-linear',
  templateUrl: './cps-progress-linear.component.html',
  styleUrls: ['./cps-progress-linear.component.scss']
})
export class CpsProgressLinearComponent {
  @Input() width: number | string = '100%';
  @Input() height: number | string = '0.5rem';
  @Input() color = 'calm';
  @Input() bgColor = 'white';
  @Input() opacity: number | string = 1;
  @Input() radius: number | string = 0;

  cvtWidth = '';
  cvtHeight = '';
  cvtRadius = '';
  cvtColor = '';
  cvtBgColor = '';

  ngOnInit(): void {
    this.cvtWidth = convertSize(this.width);
    this.cvtHeight = convertSize(this.height);
    this.cvtRadius = convertSize(this.radius);

    this.cvtColor = getCSSColor(this.color);
    this.cvtBgColor = getCSSColor(this.bgColor);
  }
}
