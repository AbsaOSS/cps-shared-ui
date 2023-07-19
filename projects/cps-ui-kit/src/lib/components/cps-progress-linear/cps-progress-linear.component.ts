import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { convertSize } from '../../utils/internal/size-utils';
import { getCSSColor } from '../../utils/colors-utils';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'cps-progress-linear',
  templateUrl: './cps-progress-linear.component.html',
  styleUrls: ['./cps-progress-linear.component.scss']
})
export class CpsProgressLinearComponent implements OnInit {
  @Input() width: number | string = '100%';
  @Input() height: number | string = '0.5rem';
  @Input() color = 'calm';
  @Input() bgColor = 'white';
  @Input() opacity: number | string = 1;
  @Input() radius: number | string = 0;

  ngOnInit(): void {
    this.width = convertSize(this.width);
    this.height = convertSize(this.height);
    this.radius = convertSize(this.radius);

    this.color = getCSSColor(this.color);
    this.bgColor = getCSSColor(this.bgColor);
  }
}
