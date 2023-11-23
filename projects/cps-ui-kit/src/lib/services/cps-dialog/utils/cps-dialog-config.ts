import { CpsTooltipPosition } from '../../../directives/cps-tooltip.directive';

export class CpsDialogConfig<T = any> {
  /**
   * An object to pass to the component loaded inside the Dialog.
   */
  data?: T;
  /**
   * Whether to show the header or not.
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
   * Whether to show the header left border.
   */
  showHeaderLeftBorder?: boolean;
  /**
   * Whether to show the header bottom border.
   */
  showHeaderBottomBorder?: boolean;
  /**
   * Identifies the element (or elements) that labels the element it is applied to.
   */
  ariaLabelledBy?: string;
  /**
   * Width of the dialog.
   */
  width?: string;
  /**
   * Height of the dialog.
   */
  height?: string;
  /**
   * Min-width of the dialog.
   */
  minWidth?: string;
  /**
   * Min-height of the dialog.
   */
  minHeight?: string;
  /**
   * Max-width of the dialog.
   */
  maxWidth?: string;
  /**
   * Max-height of the dialog.
   */
  maxHeight?: string;
  /**
   * Specifies if pressing escape key should hide the dialog.
   */
  closeOnEscape?: boolean;
  /**
   * Base zIndex value to use in layering.
   */
  baseZIndex?: number;
  /**
   * Whether to automatically manage layering.
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
   * Minimum value for the left coordinate of dialog in dragging.
   */
  minX?: number;
  /**
   * Minimum value for the top coordinate of dialog in dragging.
   */
  minY?: number;
  /**
   * Whether the dialog can be displayed full screen.
   */
  maximizable?: boolean;
  /**
   * Whether the dialog is initially opened as full screen.
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
