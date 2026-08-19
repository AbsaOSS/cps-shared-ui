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

  relativeLoaderThemedLabelOpacity: {
    html: `
<div style="width: 28.125rem; height: 12.5rem;">
  <cps-loader labelColor="energy" [opacity]="0.6"></cps-loader>
</div>`
  },

  customLabelsLoader: {
    html: `
<div style="width: 28.125rem; height: 12.5rem;">
  <cps-loader
    label="Uploading files..."
    ariaLabel="Uploading files, please wait"
    doneAriaLabel="Upload complete"></cps-loader>
</div>`
  }
};
