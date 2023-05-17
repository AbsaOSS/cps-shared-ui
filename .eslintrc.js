module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
    'cypress'
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'standard',
    'plugin:cypress/recommended'
  ],
  rules: {
    semi: 'off',
    '@typescript-eslint/semi': ['error']
  },
  globals: {
    Cypress: 'readonly'
  }
};
