import { CommonModule } from '@angular/common';
import { Component, Input, TemplateRef, ViewChild } from '@angular/core';
import { CpsIconComponent } from 'projects/cps-ui-kit/src/lib/components/cps-icon/cps-icon.component';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    CpsIconComponent,
  ],
  selector: 'cps-tab',
  templateUrl: './cps-tab.component.html',
  styleUrls: ['./cps-tab.component.scss']
})
export class CpsTabComponent {
  @Input() label!: string;
  @ViewChild(TemplateRef) content!: TemplateRef<any>;
  active = false
}
