import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import js from '@eslint/js';
import tsEslint from 'typescript-eslint';

export default defineConfig([
  js.configs.all,
  ...tsEslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', {
        args: 'after-used',
        caughtErrors: 'none',
        vars: 'all',
      }],
      'func-style': 'off',
      'indent': ['error', 2, {
        SwitchCase: 1,
      }],
      'max-classes-per-file': 'warn',
      'max-lines-per-function': 'off',
      'max-params': 'warn',
      'max-statements': 'off',
      'no-magic-numbers': 'warn',
      'no-multi-spaces': 'error',
      'no-new': 'off',
      'no-ternary': 'off',
      'no-undefined': 'off',
      'no-underscore-dangle': 'warn',
      'no-unused-vars': ['warn', {
        args: 'after-used',
        caughtErrors: 'none',
        vars: 'all',
      }],
      'object-curly-spacing': ['error', 'always'],
      'one-var': ['error', 'never'],
      'quotes': ['error', 'single', {
        allowTemplateLiterals: true,
        avoidEscape: true,
      }],
    },
  },
  globalIgnores(['dist/**/*', 'node_modules/**/*']),
]);
