import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  Renderer2,
  ViewChild,
  inject,
  type SimpleChanges
} from '@angular/core';
import {
  CpsIconComponent,
  type CpsIconType
} from '../cps-icon/cps-icon.component';
import { getCSSColor } from '../../utils/colors-utils';
import { convertSize } from '../../utils/internal/size-utils';
import { generateUniqueId } from '../../utils/internal/accessibility-utils';
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
import {
  prefersReducedMotion,
  REDUCED_MOTION_DURATION
} from '../../utils/internal/motion-utils';

const transitionType = '0.2s cubic-bezier(0.4, 0, 0.2, 1)';

/**
 * CpsExpansionPanelComponent is a component that provides content on expansion.
 * @group Components
 */
@Component({
  imports: [CpsIconComponent],
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
      transition('visible <=> hidden', [animate('{{transitionParams}}')], {
        params: { transitionParams: transitionType }
      }),
      transition('void => *', animate(0))
    ])
  ]
})
export class CpsExpansionPanelComponent
  implements OnInit, OnChanges, AfterViewInit
{
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
   * The border radius of the component of type number denoting pixels or string.
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
  @Input() prefixIcon: CpsIconType = '';

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

  private _contentAnimationPlayer: AnimationPlayer | undefined;

  readonly contentPanelId = generateUniqueId('cps-expansion-panel-content');

  isKeyboardActive = false;
  cvtWidth = '';
  cvtBorderColor = '';
  cvtBackgroundColor = '';
  cvtBorderRadius = '';

  private readonly _animationBuilder = inject(AnimationBuilder);
  private readonly _document = inject(DOCUMENT);
  private readonly _renderer = inject(Renderer2);

  get resolvedTransitionType(): string {
    return prefersReducedMotion() ? REDUCED_MOTION_DURATION : transitionType;
  }

  private _buildContentCollapseAnimation(): AnimationFactory {
    return this._animationBuilder.build([
      style({
        height: '*'
      }),
      animate(
        this.resolvedTransitionType,
        style({
          height: 0
        })
      )
    ]);
  }

  private _buildContentExpandAnimation(): AnimationFactory {
    return this._animationBuilder.build([
      style({
        height: 0
      }),
      animate(
        this.resolvedTransitionType,
        style({
          height: '*'
        })
      )
    ]);
  }

  ngOnInit(): void {
    this.cvtBorderColor = getCSSColor(this.borderColor, this._document);
    this.cvtBackgroundColor = getCSSColor(this.backgroundColor, this._document);
    this.cvtBorderRadius = convertSize(this.borderRadius);
    this.cvtWidth = convertSize(this.width);

    this._logHeaderTitleError();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.borderColor) {
      this.cvtBorderColor = getCSSColor(this.borderColor, this._document);
    }
    if (changes.backgroundColor) {
      this.cvtBackgroundColor = getCSSColor(
        this.backgroundColor,
        this._document
      );
    }
    if (changes.borderRadius) {
      this.cvtBorderRadius = convertSize(this.borderRadius);
    }
    if (changes.width) {
      this.cvtWidth = convertSize(this.width);
    }
    if (changes.headerTitle) {
      this._logHeaderTitleError();
    }
  }

  ngAfterViewInit(): void {
    if (!this.isExpanded) {
      this._updateContentVisibilityStyles(false);
    }
  }

  onHeaderKeydown(event: KeyboardEvent): void {
    if (this.disabled || event.repeat) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.isKeyboardActive = true;
      this.toggleExpansion();
    }
  }

  onHeaderKeyup(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      this.isKeyboardActive = false;
    }
  }

  toggleExpansion(): void {
    if (this.disabled || this._contentAnimationPlayer) return;

    const el = this.panelContentElem?.nativeElement;
    if (this.isExpanded) {
      this._contentAnimationPlayer =
        this._buildContentCollapseAnimation().create(el);
      this._contentAnimationPlayer.onDone(() => {
        this._updateContentVisibilityStyles(false, el);
      });
    } else {
      this._updateContentVisibilityStyles(true, el);
      this._contentAnimationPlayer =
        this._buildContentExpandAnimation().create(el);
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

  private _logHeaderTitleError() {
    if (!this.headerTitle?.trim()) {
      console.error(
        'CpsExpansionPanelComponent: the expansion panel must have headerTitle.'
      );
    }
  }
}
