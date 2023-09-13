import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { getCSSColor } from '../../utils/colors-utils';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'cps-loader',
  templateUrl: './cps-loader.component.html',
  styleUrls: ['./cps-loader.component.scss']
})
export class CpsLoaderComponent implements OnInit {
  @Input() fullScreen = false;
  @Input() opacity: number | string = 0.1;
  @Input() labelColor = 'depth';
  @Input() showLabel = true;

  backgroundColor = 'rgba(0, 0, 0, 0.1)';

  ngOnInit(): void {
    this.backgroundColor = `rgba(0, 0, 0, ${this.opacity})`;
    this.labelColor = getCSSColor(this.labelColor);
  }
}
