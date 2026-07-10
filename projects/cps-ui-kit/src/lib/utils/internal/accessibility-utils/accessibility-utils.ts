let id = 0;
const randomPrefix = Math.random().toString(36).slice(2, 8);

export const generateUniqueId = (prefix: string = 'cps'): string => {
  return `${prefix}-${randomPrefix}-${id++}`;
};

export const focusElement = (element?: HTMLElement): void => {
  if (element) {
    setTimeout(() => element.focus());
  }
};

export const logMissingAriaLabelError = (
  componentName: string,
  label?: string,
  ariaLabel?: string
): void => {
  if (!label?.trim() && !ariaLabel?.trim()) {
    console.error(
      `${componentName}: unlabeled component must have an ariaLabel for accessibility.`
    );
  }
};
