import { CommonModule } from '@angular/common';
import { Component, Input, TemplateRef, ViewChild } from '@angular/core';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'cps-tab',
  templateUrl: './cps-tab.component.html',
  styleUrls: ['./cps-tab.component.scss']
})
export class CpsTabComponent {
  @Input() label!: string;
  @Input() icon?: string;
  @ViewChild(TemplateRef) content!: TemplateRef<any>;
  active = false;
}
