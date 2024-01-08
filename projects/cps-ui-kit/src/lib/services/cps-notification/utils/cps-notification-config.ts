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
   * Specifies whether the user is allowed to close the notification.
   */
  disableClose?: boolean;
  /**
   * Transition options of the animation.
   */
  transitionOptions?: string;
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
  /**
   * Message to be displayed in the notification.
   */
  message?: string;
  /**
   * Details to be displayed in the notification.
   */
  details?: string;
}
