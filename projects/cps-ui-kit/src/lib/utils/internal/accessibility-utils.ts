let id = 0;
const randomPrefix = Math.random().toString(36).slice(2, 8);

export const generateUniqueId = (prefix: string = 'cps'): string => {
  return `${prefix}-${randomPrefix}-${id++}`;
};

export const getComputedLabel = (context: {
  label?: string;
  error?: string;
  externalError?: string;
  hideDetails?: boolean;
}): string => {
  const parts: string[] = [];

  // Always add label
  if (context.label) {
    parts.push(context.label.trim().replace(/\.*$/, '.')); // ensure single period
  }

  // Add error if exists and not hidden
  const errorText = context.error || context.externalError;
  if (errorText && !context.hideDetails) {
    const cleanedError = errorText.trim().replace(/\.*$/, '');
    parts.push(`Error: ${cleanedError}.`);
  }

  return parts.join(' ');
};
