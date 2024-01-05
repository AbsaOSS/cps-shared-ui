/* eslint-disable no-unused-vars */
/**
 * An enumeration of the different types of notifications that can be displayed.
 */
export enum CpsNotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

/**
 * An enumeration of notifications categories that can be displayed.
 */
export enum CpsNotificationCategory {
  TOAST = 'toast',
  ALERT = 'alert'
}

/**
 * An enumeration of notifications positions.
 */
export enum CpsNotificationPosition {
  CENTER = 'center',
  TOP = 'top',
  BOTTOM = 'bottom',
  LEFT = 'left',
  RIGHT = 'right',
  TOPLEFT = 'top-left',
  TOPRIGHT = 'top-right',
  BOTTOMLEFT = 'bottom-left',
  BOTTOMRIGHT = 'bottom-right'
}

export class CpsNotificationConfig<T = any> {
  /**
   * An object to pass to the component loaded inside the Dialog.
   */
  data?: T;
  /**
   * Specifies if pressing escape key should hide the notification.
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
   * Specifies whether the user is allowed to close the notification.
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
   * Style class of the mask.
   */
  maskStyleClass?: string;
  /**
   * Keeps dialog in the viewport.
   */
  keepInViewport?: boolean;
  /**
   * Category of the notification, options are "toast" or "alert".
   * @default toast
   */
  category?: CpsNotificationCategory;
  /**
   * Type of the notification, options are "warning", "success", "error" or "info".
   */
  type?: CpsNotificationType;
  /**
   * Position of the notification, options are "center", "top", "bottom", "left", "right", "top-left", "top-right", "bottom-left" or "bottom-right".
   * Defaults top-right for "toast" category and bottom for "alert" category
   */
  position?: CpsNotificationPosition;
  /**
   * Max amount of notifications that can be simultaneously visualized within a container.
   * @default undefined
   */
  maxAmount?: number;
  /**
   * The duration (in milliseconds) that the toast will be displayed before automatically closing.
   * @default 5000
   */
  timeout?: number;
}
