import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  Renderer2,
  ViewChild
} from '@angular/core';
import { CpsIconComponent, IconType } from '../cps-icon/cps-icon.component';
import { getCSSColor } from '../../utils/colors-utils';
import { convertSize } from '../../utils/internal/size-utils';
import {
  AnimationBuilder,
  AnimationFactory,
  AnimationPlayer,
  animate,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';

const transitionType = '0.2s cubic-bezier(0.4, 0, 0.2, 1)';

/**
 * CpsExpansionPanelComponent is a component that provides content on expansion.
 * @group Components
 */
@Component({
  standalone: true,
  imports: [CommonModule, CpsIconComponent],
  selector: 'cps-expansion-panel',
  templateUrl: './cps-expansion-panel.component.html',
  styleUrls: ['./cps-expansion-panel.component.scss'],
  animations: [
    trigger('panelHeader', [
      state(
        'hidden',
        style({
          borderBottom: ''
        })
      ),
      state(
        'visible',
        style({
          borderBottom: '{{borderStyle}}'
        }),
        { params: { borderStyle: '' } }
      ),
      transition('visible <=> hidden', [animate(transitionType)]),
      transition('void => *', animate(0))
    ])
  ]
})
export class CpsExpansionPanelComponent implements OnInit, AfterViewInit {
  /**
   * Title of the expansionPanel element.
   * @group Props
   */
  @Input() headerTitle = '';

  /**
   * Background color of the expansion panel element.
   * @group Props
   */
  @Input() backgroundColor = 'transparent';

  /**
   * Determines whether to show the chevron icon.
   * @group Props
   */
  @Input() showChevron = true;

  /**
   * Indicates current expansion state.
   * @group Props
   */
  @Input() isExpanded = false;

  /**
   * Determines whether expansion panel is disabled.
   * @group Props
   */
  @Input() disabled = false;

  /**
   * If true, expansion panel element will have borders.
   * @group Props
   */
  @Input() bordered = true;

  /**
   * The border radius of the component.
   * @group Props
   */
  @Input() borderRadius: number | string = 0;

  /**
   * Border color of the expansion panel.
   * @group Props
   */
  @Input() borderColor = 'line-light';

  /**
   * The width of the expansion panel of type number denoting pixels or string.
   * @group Props
   */
  @Input() width: number | string = '100%';

  /**
   * Name of the icon in front of the title.
   * @group Props
   */
  @Input() prefixIcon: IconType = '';

  /**
   * Callback to invoke after a tab gets collapsed.
   * @param {void}
   * @group Emits
   */
  @Output() afterCollapse: EventEmitter<void> = new EventEmitter<void>();

  /**
   * Callback to invoke after a tab gets expanded.
   * @param {void}
   * @group Emits
   */
  @Output() afterExpand: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild('panelContentElem') panelContentElem!: ElementRef;

  private _contentExpandAnimation: AnimationFactory;
  private _contentCollapseAnimation: AnimationFactory;
  private _contentAnimationPlayer: AnimationPlayer | undefined;

  constructor(
    private _animationBuilder: AnimationBuilder,
    private _renderer: Renderer2
  ) {
    this._contentCollapseAnimation = this._animationBuilder.build([
      style({
        height: '*'
      }),
      animate(
        transitionType,
        style({
          height: 0
        })
      )
    ]);

    this._contentExpandAnimation = this._animationBuilder.build([
      style({
        height: 0
      }),
      animate(
        transitionType,
        style({
          height: '*'
        })
      )
    ]);
  }

  ngOnInit(): void {
    this.borderColor = getCSSColor(this.borderColor);
    this.backgroundColor = getCSSColor(this.backgroundColor);
    this.borderRadius = convertSize(this.borderRadius);
    this.width = convertSize(this.width);
  }

  ngAfterViewInit(): void {
    if (!this.isExpanded) {
      this._updateContentVisibilityStyles(false);
    }
  }

  toggleExpansion(): void {
    if (this.disabled || this._contentAnimationPlayer) return;

    const el = this.panelContentElem?.nativeElement;
    if (this.isExpanded) {
      this._contentAnimationPlayer = this._contentCollapseAnimation.create(el);
      this._contentAnimationPlayer.onDone(() => {
        this._updateContentVisibilityStyles(false, el);
      });
    } else {
      this._updateContentVisibilityStyles(true, el);
      this._contentAnimationPlayer = this._contentExpandAnimation.create(el);
    }

    this._contentAnimationPlayer.onStart(() => {
      this._renderer.setStyle(el, 'overflow', 'hidden');
    });

    this._contentAnimationPlayer.onDone(() => {
      this._renderer.removeStyle(el, 'overflow');
      this._contentAnimationPlayer?.destroy();
      this._contentAnimationPlayer = undefined;
    });

    this._contentAnimationPlayer.play();

    this.isExpanded = !this.isExpanded;

    if (this.isExpanded) {
      this.afterExpand.emit();
    }
    if (!this.isExpanded) {
      this.afterCollapse.emit();
    }
  }

  private _updateContentVisibilityStyles(isVisible: boolean, el?: any) {
    el = el || this.panelContentElem?.nativeElement;
    if (!el) return;

    if (isVisible) {
      this._renderer.removeStyle(el, 'height');
      this._renderer.removeStyle(el, 'visibility');
    } else {
      this._renderer.setStyle(el, 'height', '0');
      this._renderer.setStyle(el, 'visibility', 'hidden');
    }
  }
}
