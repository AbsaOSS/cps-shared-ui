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
 * An enumeration of appearances of notifications.
 */
export enum CpsNotificationAppearance {
  FILLED = 'filled',
  OUTLINED = 'outlined'
}

/**
 * An enumeration of positions of notifications.
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

export interface CpsNotificationConfig {
  /**
   * Message to be displayed in the notification.
   */
  message?: string;
  /**
   * Details to be displayed in the notification.
   */
  details?: string;
  /**
   * Type of the notification, options are "warning", "success", "error" or "info".
   */
  type?: CpsNotificationType;
  /**
   * Position of the notification, options are "center", "top", "bottom", "left", "right", "top-left", "top-right", "bottom-left" or "bottom-right".
   * @default top-right
   */
  position?: CpsNotificationPosition;
  /**
   * Appearance of the notification, options are "filled" or "outlined".
   * @default filled
   */
  appearance?: CpsNotificationAppearance;
  /**
   * The duration (in milliseconds) that the notification will be displayed before automatically closing.
   * Value 0 means that the notification is persistent and will not be automatically closed.
   * @default 5000
   */
  timeout?: number;
  /**
   * Max amount of notifications that can be simultaneously visualized within a positioned container.
   * @default undefined
   */
  maxAmount?: number;
  /**
   * Max width of the notification of type number denoting pixels or string.
   */
  maxWidth?: string;
}
