module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'standard',
    'plugin:cypress/recommended',
    'prettier'
  ],
  plugins: ['@typescript-eslint', 'cypress', 'prettier'],
  rules: {
    'prettier/prettier': ['error']
  },
  globals: {
    Cypress: 'readonly'
  }
};
