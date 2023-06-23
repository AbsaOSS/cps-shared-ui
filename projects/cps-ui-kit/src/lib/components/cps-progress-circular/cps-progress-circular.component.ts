import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { convertSize } from '../../utils/size-utils';
import { getCSSColor } from '../../utils/colors-utils';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'cps-progress-circular',
  templateUrl: './cps-progress-circular.component.html',
  styleUrls: ['./cps-progress-circular.component.scss']
})
export class CpsProgressCircularComponent implements OnInit {
  @Input() diameter: number | string = 40;
  @Input() strokeWidth: number | string = 4;
  @Input() color = 'calm';

  ngOnInit(): void {
    this.diameter = convertSize(this.diameter);
    this.strokeWidth = convertSize(this.strokeWidth);

    this.color = getCSSColor(this.color);
  }
}