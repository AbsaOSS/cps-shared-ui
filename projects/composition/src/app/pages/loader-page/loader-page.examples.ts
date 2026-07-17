export const loaderExamples: Record<string, { html: string; ts?: string }> = {
  fullscreenLoader: {
    html: `
<cps-button
  label="Toggle fullscreen loader"
  (clicked)="onFullScreenClick()"></cps-button>
@if (fullScreenOpened) {
  <cps-loader [fullScreen]="true"></cps-loader>
}`,
    ts: `
fullScreenOpened = false;

onFullScreenClick() {
  this.fullScreenOpened = true;
  setTimeout(() => {
    this.fullScreenOpened = false;
  }, 3000);
}`
  },

  relativeLoader: {
    html: `
<div style="width: 28.125rem; height: 12.5rem;">
  <cps-loader></cps-loader>
</div>`
  },

  relativeLoaderNoLabelTransparent: {
    html: `
<div style="width: 28.125rem; height: 12.5rem;">
  <cps-loader [showLabel]="false" opacity="0"></cps-loader>
</div>`
  },

  relativeLoaderWhiteLabelOpacity: {
    html: `
<div style="width: 28.125rem; height: 12.5rem;">
  <cps-loader labelColor="white" [opacity]="0.6"></cps-loader>
</div>`
  }
};
