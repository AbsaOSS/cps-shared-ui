export const convertSize = (size: number | string): string => {
  let res = String(size).trim();
  if (!res) {
    return '';
  }
  if (/^\d+(\.\d+)?$/i.test(res)) {
    return res + 'px';
  }
  if (/^\d+(\.\d+)?(px|rem|em|%)$/i.test(res)) {
    return res;
  }

  throw new Error(`Invalid size value: ${size}`);
};

export const parseSize = (size: string): { value: number; unit: string } => {
  const match = size.match(/^(\d+(?:\.\d+)?)(px|rem|em|%)$/);
  if (!match) throw new Error(`Invalid size value: ${size}`);
  const value = parseFloat(match[1]);
  const unit = match[2];
  return { value, unit };
};
