/* eslint-disable no-unused-vars */

/**
 * CpsColumnFilterMatchMode is used to define how the filter value should be matched.
 * @group Enums
 */
export enum CpsColumnFilterMatchMode {
  STARTS_WITH = 'startsWith',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'notContains',
  ENDS_WITH = 'endsWith',
  EQUALS = 'equals',
  NOT_EQUALS = 'notEquals',
  IN = 'in',
  LESS_THAN = 'lt',
  LESS_THAN_OR_EQUAL_TO = 'lte',
  GREATER_THAN = 'gt',
  GREATER_THAN_OR_EQUAL_TO = 'gte',
  BETWEEN = 'between',
  IS = 'is',
  IS_NOT = 'isNot',
  BEFORE = 'before',
  AFTER = 'after',
  DATE_IS = 'dateIs',
  DATE_IS_NOT = 'dateIsNot',
  DATE_BEFORE = 'dateBefore',
  DATE_AFTER = 'dateAfter'
}

/**
 * CpsColumnFilterCategoryOption is used to define the options of the CpsColumnFilterCategoryComponent.
 * @group Types
 */
export type CpsColumnFilterCategoryOption = {
  value: any;
  label?: string;
  icon?: string;
  disabled?: boolean;
  tooltip?: string;
};

/**
 * CpsColumnFilterType is used to define the type of the column filter.
 * @group Types
 */
export type CpsColumnFilterType =
  | 'text'
  | 'number'
  | 'date'
  | 'boolean'
  | 'category';
