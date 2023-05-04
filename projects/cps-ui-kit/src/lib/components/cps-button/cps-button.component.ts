import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { getCSSColor } from '../../utils/colors-utils';
import { CpsIconComponent } from '../cps-icon/cps-icon.component';

@Component({
  standalone: true,
  imports: [CommonModule, CpsIconComponent],
  selector: 'cps-button',
  templateUrl: './cps-button.component.html',
  styleUrls: ['./cps-button.component.scss'],
})
export class CpsButtonComponent implements OnInit {
  @Input() color = 'calm';
  @Input() contentColor = 'white'; //works only with solid type
  @Input() type: 'solid' | 'outlined' | 'borderless' = 'solid';
  @Input() label = '';
  @Input() icon = '';
  @Input() iconPosition: 'before' | 'after' = 'before';
  @Input() size: 'xsmall' | 'small' | 'normal' | 'large' | 'fill' = 'normal';
  @Input() width: number | string = 0;
  @Input() height: number | string = 0;
  @Input() disabled = false;
  @Input() loading = false;

  @Output() clicked = new EventEmitter();

  buttonColor = '';
  textColor = '';

  pxWidth = '';
  pxHeight = '';
  pxFontSize = '';
  pxIconSize = '';

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
      const _w = parseInt('' + this.width);
      if (_w && !isNaN(_w)) {
        this.pxWidth = _w + 'px';
      }
    }

    if (this.height) {
      const _h = parseInt('' + this.height);
      if (_h && !isNaN(_h)) {
        this.pxHeight = _h + 'px';
      }

      if (this.pxHeight) {
        this.pxFontSize = Math.floor(parseInt(this.pxHeight) * 0.4) + 'px';
        this.pxIconSize = Math.ceil(parseInt(this.pxHeight) * 0.4) + 'px';
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
        case 'fill': {
          this.classesList.push('button--fill');
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
