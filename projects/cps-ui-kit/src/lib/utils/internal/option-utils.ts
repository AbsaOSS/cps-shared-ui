export type OptionKey = string | ((option: any) => any);

export function getOptionProp(option: any, key: OptionKey): any {
  if (typeof key === 'function') return key(option);
  return option?.[key];
}
