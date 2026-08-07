export const progressCircularExamples: Record<
  string,
  { html: string; ts?: string }
> = {
  variants: {
    html: `
<div style="display: flex; align-items: center; gap: 3rem; overflow: hidden;">
  <cps-progress-circular
    color="luxury"
    diameter="7.5rem"
    strokeWidth="0.5rem"></cps-progress-circular>
  <cps-progress-circular diameter="3.75rem"></cps-progress-circular>
  <cps-progress-circular
    color="surprise"
    diameter="1.875rem"
    strokeWidth="0.1875rem"></cps-progress-circular>
  <cps-progress-circular
    color="prepared"
    diameter="0.9375rem"
    strokeWidth="0.125rem"></cps-progress-circular>
</div>`
  }
};
