export interface ElementRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function getElementRect(el: HTMLElement): ElementRect {
  const rect = el.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

export function isElementVisible(el: HTMLElement): boolean {
  const style = getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

/** Generates a canonical DOM path key for grouping purposes. */
export function getElementKey(el: HTMLElement): string {
  const parts: string[] = [];
  let node: Element | null = el;
  while (node && node !== document.documentElement) {
    const parent: Element | null = node.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children);
      const index = siblings.indexOf(node);
      parts.unshift(`${node.tagName}[${index}]`);
    } else {
      parts.unshift(node.tagName);
    }
    node = parent;
  }
  return parts.join('>');
}

export function isElementOffScreen(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // Element is entirely outside the viewport (including negative positions)
  return (
    rect.right < 0 ||
    rect.bottom < 0 ||
    rect.left > vw ||
    rect.top > vh ||
    (rect.width === 0 && rect.height === 0)
  );
}
