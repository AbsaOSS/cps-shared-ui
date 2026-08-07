export const convertSize = (
  size: number | string | null | undefined
): string => {
  if (size == null) return '';
  const res = String(size).trim();
  if (!res) return '';
  if (/^-?\d+(\.\d+)?$/i.test(res)) return res + 'px';
  if (
    /^-?\d+(\.\d+)?(px|rem|em|%|vw|vh|vmin|vmax|dvw|dvh|svw|svh|lvw|lvh|ch|ex|cm|mm|in|pt|pc|fr)$/i.test(
      res
    ) ||
    /^(auto|min-content|max-content|fit-content|none|inherit|initial|unset|normal)$/i.test(
      res
    ) ||
    /^(calc|min|max|clamp|fit-content|var|env)\(.+\)$/i.test(res)
  )
    return res;
  return '';
};

export const parseSize = (
  size: string
): { value: number; unit: string } | null => {
  const match = size.match(/^(-?\d+(?:\.\d+)?)(px|rem|em|%)$/);
  if (!match) return null;
  return { value: parseFloat(match[1]), unit: match[2] };
};
