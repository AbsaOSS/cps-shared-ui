import 'jest-preset-angular/setup-jest';

jest.mock("projects/cps-ui-kit/package.json", () => ({ version: '1.0.0' }), {virtual: true});

window.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
