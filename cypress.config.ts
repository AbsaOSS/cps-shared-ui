import { defineConfig } from 'cypress';

export default defineConfig({
  component: {
    devServer: {
      framework: 'angular',
      bundler: 'webpack'
    },
    specPattern: 'projects/cps-ui-kit/**/*.cy.ts',
    video: false
  }
});
