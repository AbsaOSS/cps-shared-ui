export const convertSize = (
  size: number | string | null | undefined
): string => {
  if (size == null) return '';
  const res = String(size).trim();
  if (!res) return '';
  if (/^\d+(\.\d+)?$/i.test(res)) return res + 'px';
  if (/^\d+(\.\d+)?(px|rem|em|%)$/i.test(res)) return res;
  // calc(), auto, fit-content, min(), vw, etc. - pass through as-is
  return res;
};

export const parseSize = (
  size: string
): { value: number; unit: string } | null => {
  const match = size.match(/^(-?\d+(?:\.\d+)?)(px|rem|em|%)$/);
  if (!match) return null;
  return { value: parseFloat(match[1]), unit: match[2] };
};
