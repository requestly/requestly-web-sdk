module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended', // last config
  ],
  parserOptions: {
    ecmaFeatures: 2018,
    sourceType: 'module',
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': ['error', { ignoreRestArgs: false, fixToUnknown: false }],
    '@typescript-eslint/no-var-requires': 0,
    '@typescript-eslint/ban-ts-ignore': 'off',
    quotes: ['error', 'single'],
  },
  overrides: [
    {
      files: ['*.ts'],
      rules: {
        '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
      },
    },
  ],
};
