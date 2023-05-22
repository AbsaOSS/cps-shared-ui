import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostBinding,
  Input,
  OnInit,
  Output
} from '@angular/core';
import { getCSSColor } from '../../utils/colors-utils';
import { CpsIconComponent } from '../cps-icon/cps-icon.component';
import { convertSize, parseSize } from '../../utils/size-utils';

@Component({
  standalone: true,
  imports: [CommonModule, CpsIconComponent],
  selector: 'cps-button',
  templateUrl: './cps-button.component.html',
  styleUrls: ['./cps-button.component.scss']
})
export class CpsButtonComponent implements OnInit {
  @Input() color = 'calm';
  @Input() contentColor = 'white'; // works only with solid type
  @Input() type: 'solid' | 'outlined' | 'borderless' = 'solid';
  @Input() label = '';
  @Input() icon = '';
  @Input() iconPosition: 'before' | 'after' = 'before';
  @Input() size: 'xsmall' | 'small' | 'normal' | 'large' = 'normal';
  @Input() width: number | string = 0;
  @Input() height: number | string = 0;
  @Input() disabled = false;
  @Input() loading = false;

  @Output() clicked = new EventEmitter();

  buttonColor = '';
  textColor = '';

  @HostBinding('style.width')
  cvtWidth = '';

  cvtHeight = '';
  cvtFontSize = '';
  cvtIconSize = '';

  classesList: string[] = [];

  ngOnInit(): void {
    this.buttonColor = getCSSColor(this.color);
    this.textColor =
      this.type === 'solid' ? getCSSColor(this.contentColor) : this.buttonColor;
    this.setClasses();
  }

  setClasses() {
    this.classesList = ['button'];

    if (this.width) {
      this.cvtWidth = convertSize(this.width);
    }

    if (this.height) {
      this.cvtHeight = convertSize(this.height);
      if (this.cvtHeight) {
        const parsedHeight = parseSize(this.cvtHeight);
        const unit = parsedHeight.unit;
        const size = parsedHeight.value * 0.4;
        const isPx = unit === 'px';

        this.cvtFontSize = `${isPx ? Math.floor(size) : size}${unit}`;
        this.cvtIconSize = `${isPx ? Math.ceil(size) : size}${unit}`;
      }
    } else {
      switch (this.size) {
        case 'normal': {
          this.classesList.push('button--normal');
          break;
        }
        case 'large': {
          this.classesList.push('button--large');
          break;
        }
        case 'small': {
          this.classesList.push('button--small');
          break;
        }
        case 'xsmall': {
          this.classesList.push('button--xsmall');
          break;
        }
      }
    }

    switch (this.type) {
      case 'solid': {
        this.classesList.push('button--solid');
        break;
      }
      case 'outlined': {
        this.classesList.push('button--outlined');
        break;
      }
      case 'borderless': {
        this.classesList.push('button--borderless');
        break;
      }
    }

    if (this.icon && this.label) {
      switch (this.iconPosition) {
        case 'before': {
          this.classesList.push('button--icon-before');
          break;
        }
        case 'after': {
          this.classesList.push('button--icon-after');
          break;
        }
      }
    }
  }

  onClick(event: Event) {
    this.clicked.emit(event);
  }
}
