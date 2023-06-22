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
import { CpsIconComponent, IconType } from '../cps-icon/cps-icon.component';
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
  @Input() icon: IconType = '';
  @Input() iconPosition: 'before' | 'after' = 'before';
  @Input() size: 'xsmall' | 'small' | 'normal' | 'large' = 'normal';
  @Input() width: number | string = 0;
  @Input() height: number | string = 0;
  @Input() disabled = false;
  @Input() loading = false;

  @Output() clicked = new EventEmitter();
  @Output() focused = new EventEmitter();

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
    this.classesList = ['cps-button'];

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
          this.classesList.push('cps-button--normal');
          break;
        }
        case 'large': {
          this.classesList.push('cps-button--large');
          break;
        }
        case 'small': {
          this.classesList.push('cps-button--small');
          break;
        }
        case 'xsmall': {
          this.classesList.push('cps-button--xsmall');
          break;
        }
      }
    }

    switch (this.type) {
      case 'solid': {
        this.classesList.push('cps-button--solid');
        break;
      }
      case 'outlined': {
        this.classesList.push('cps-button--outlined');
        break;
      }
      case 'borderless': {
        this.classesList.push('cps-button--borderless');
        break;
      }
    }

    if (this.icon && this.label) {
      switch (this.iconPosition) {
        case 'before': {
          this.classesList.push('cps-button--icon-before');
          break;
        }
        case 'after': {
          this.classesList.push('cps-button--icon-after');
          break;
        }
      }
    }
  }

  onClick(event: Event) {
    this.clicked.emit(event);
  }

  onFocus(event: Event) {
    this.focused.emit(event);
  }
}
