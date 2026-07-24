export const progressLinearExamples: Record<
  string,
  { html: string; ts?: string }
> = {
  variants: {
    html: `
<div style="display: flex; flex-direction: column; gap: 3rem;">
  <cps-progress-linear></cps-progress-linear>
  <cps-progress-linear
    color="energy"
    radius="0.25rem"
    bgColor="energy-highlighten"
    height="0.75rem">
  </cps-progress-linear>
  <cps-progress-linear
    height="0.1875rem"
    radius="0.25rem"
    opacity="0.3"
    bgColor="transparent">
  </cps-progress-linear>
  <cps-progress-linear
    color="grounded"
    radius="0.625rem"
    bgColor="grounded-highlighten"
    width="25rem"
    height="0.75rem"></cps-progress-linear>
</div>`
  }
};
