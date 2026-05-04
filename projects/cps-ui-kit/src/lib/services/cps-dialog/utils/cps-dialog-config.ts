import { CpsTooltipPosition } from '../../../directives/cps-tooltip/cps-tooltip.directive';

/**
 * Defines the auto-focus target when the dialog opens.
 * - 'dialog' - focuses the dialog container itself
 * - 'first-tabbable' - focuses the first tabbable element inside the dialog
 * @group Types
 */
export type CpsDialogAutoFocusTarget = 'dialog' | 'first-tabbable';

/**
 * Configuration for the dialog service.
 * @group Interface
 */
export class CpsDialogConfig<T = any> {
  /**
   * An object to pass to the component loaded inside the Dialog.
   */
  data?: T;
  /**
   * Determines whether to show the header or not.
   */
  showHeader?: boolean;
  /**
   * Header text of the dialog.
   */
  headerTitle?: string;
  /**
   * Header information tooltip.
   */
  headerInfoTooltip?: string;
  /**
   * Header information tooltip position.
   */
  headerInfoTooltipPosition?: CpsTooltipPosition;
  /**
   * Header icon.
   */
  headerIcon?: string;
  /**
   * Header icon color.
   */
  headerIconColor?: string;
  /**
   * Determines whether to show the header left border.
   */
  showHeaderLeftBorder?: boolean;
  /**
   * Determines whether to show the header bottom border.
   */
  showHeaderBottomBorder?: boolean;
  /**
   * Identifies the element that labels the element it is applied to. Takes precedence over ariaLabel.
   */
  ariaLabelledBy?: string;
  /**
   * Defines a string value that labels the dialog for assistive technologies when no visible title or ariaLabelledBy is present.
   */
  ariaLabel?: string;
  /**
   * Identifies the element that describes the dialog content for assistive technologies.
   */
  ariaDescribedBy?: string;
  /**
   * Defines which element receives focus when the dialog opens.
   * - 'dialog' - focuses the dialog container
   * - 'first-tabbable' / true - focuses the first tabbable element
   * - string (a CSS selector) - focuses the first matching element
   * - false - disables auto-focus
   * @default true
   */
  autoFocus?: CpsDialogAutoFocusTarget | string | boolean;
  /**
   * Width of the dialog, a number denoting pixels or a string.
   */
  width?: number | string;
  /**
   * Height of the dialog, a number denoting pixels or a string.
   */
  height?: number | string;
  /**
   * Min-width of the dialog, a number denoting pixels or a string.
   */
  minWidth?: number | string;
  /**
   * Min-height of the dialog, a number denoting pixels or a string.
   */
  minHeight?: number | string;
  /**
   * Max-width of the dialog, a number denoting pixels or a string.
   */
  maxWidth?: number | string;
  /**
   * Max-height of the dialog, a number denoting pixels or a string.
   */
  maxHeight?: number | string;
  /**
   * Specifies if pressing escape key should hide the dialog.
   */
  closeOnEscape?: boolean;
  /**
   * Base zIndex value to use in layering.
   */
  baseZIndex?: number;
  /**
   * Determines whether to automatically manage layering.
   */
  autoZIndex?: boolean;
  /**
   * Specifies whether the user is allowed to close the dialog.
   */
  disableClose?: boolean;
  /**
   * Inline style of the component.
   */
  style?: { [klass: string]: any } | null | undefined;
  /**
   * Style class of the component.
   */
  styleClass?: string;
  /**
   * Inline style of the content.
   */
  contentStyle?: { [klass: string]: any } | null | undefined;
  /**
   * Style class of the content.
   */
  contentStyleClass?: string;
  /**
   * Transition options of the animation.
   */
  transitionOptions?: string;
  /**
   * Adds a close button to the header to hide the dialog.
   */
  showCloseBtn?: boolean;
  /**
   * Defines if background should be blocked when dialog is displayed.
   */
  modal?: boolean;
  /**
   * When modal dialog is displayed, determines whether background should be blurred.
   */
  blurredBackground?: boolean;
  /**
   * Style class of the mask.
   */
  maskStyleClass?: string;
  /**
   * Enables resizing of the content.
   */
  resizable?: boolean;
  /**
   * Enables dragging to change the position using header.
   */
  draggable?: boolean;
  /**
   * Keeps dialog in the viewport.
   */
  keepInViewport?: boolean;
  /**
   * Minimum value for the left coordinate of dialog in dragging, a number denoting pixels or a string.
   */
  minX?: number | string;
  /**
   * Minimum value for the top coordinate of dialog in dragging, a number denoting pixels or a string.
   */
  minY?: number | string;
  /**
   * Determines whether the dialog can be displayed full screen.
   */
  maximizable?: boolean;
  /**
   * Determines whether the dialog is initially opened as full screen.
   */
  maximized?: boolean;
  /**
   * Position of the dialog, options are "center", "top", "bottom", "left", "right", "top-left", "top-right", "bottom-left" or "bottom-right".
   */
  position?:
    | 'center'
    | 'top'
    | 'bottom'
    | 'left'
    | 'right'
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right';
}
