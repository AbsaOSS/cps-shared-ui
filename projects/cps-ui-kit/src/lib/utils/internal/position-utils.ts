export const hasSpaceBelow = (box: any, optionsClass: string): boolean => {
  const containerRect = box?.nativeElement?.getBoundingClientRect();
  if (!containerRect) return true;

  const optionsRect = box?.nativeElement
    ?.querySelector(optionsClass)
    ?.getBoundingClientRect();

  if (!optionsRect) return true;

  return window.innerHeight - containerRect.bottom >= optionsRect.height;
};
