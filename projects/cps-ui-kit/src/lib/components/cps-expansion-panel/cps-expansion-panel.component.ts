import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CpsIconComponent, IconType } from '../cps-icon/cps-icon.component';
import { getCSSColor } from '../../utils/colors-utils';
import { convertSize } from '../../utils/internal/size-utils';
import {
  animate,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';

@Component({
  standalone: true,
  imports: [CommonModule, CpsIconComponent],
  selector: 'cps-expansion-panel',
  templateUrl: './cps-expansion-panel.component.html',
  styleUrls: ['./cps-expansion-panel.component.scss'],
  animations: [
    trigger('panelContent', [
      state(
        'hidden',
        style({
          height: '0',
          visibility: 'hidden'
        })
      ),
      state(
        'visible',
        style({
          height: '*'
        })
      ),
      transition('visible <=> hidden', [
        animate('0.2s cubic-bezier(0.4, 0, 0.2, 1)')
      ]),
      transition('void => *', animate(0))
    ]),
    trigger('panelHeader', [
      state(
        'hidden',
        style({
          borderBottom: '0'
        })
      ),
      state(
        'visible',
        style({
          borderBottom: '{{borderStyle}}'
        }),
        { params: { borderStyle: '0' } }
      ),
      transition('visible <=> hidden', [
        animate('0.2s cubic-bezier(0.4, 0, 0.2, 1)')
      ]),
      transition('void => *', animate(0))
    ])
  ]
})
export class CpsExpansionPanelComponent implements OnInit {
  @Input() headerTitle = '';
  @Input() backgroundColor = 'transparent';
  @Input() showChevron = true;
  @Input() isExpanded = false;
  @Input() disabled = false;
  @Input() bordered = true;
  @Input() borderRadius: number | string = '4px';
  @Input() width: number | string = '100%';
  @Input() prefixIcon: IconType = '';

  @Output() afterCollapse: EventEmitter<void> = new EventEmitter<void>();
  @Output() afterExpand: EventEmitter<void> = new EventEmitter<void>();

  ngOnInit(): void {
    this.backgroundColor = getCSSColor(this.backgroundColor);
    this.borderRadius = convertSize(this.borderRadius);
    this.width = convertSize(this.width);
  }

  toggleExpansion(): void {
    if (!this.disabled) {
      this.isExpanded = !this.isExpanded;
      if (this.isExpanded) {
        this.afterExpand.emit();
      }
      if (!this.isExpanded) {
        this.afterCollapse.emit();
      }
    }
  }
}
