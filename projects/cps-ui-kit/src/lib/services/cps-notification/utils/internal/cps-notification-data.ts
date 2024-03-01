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
 * Defines data type for the notification data.
 */
export interface CpsNotificationData {
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
}
