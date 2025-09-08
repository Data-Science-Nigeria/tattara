import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import { fixupConfigRules, fixupPluginRules } from '@eslint/compat';
import prettier from 'eslint-plugin-prettier';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

const eslintConfig = [
  // Add ignores at the beginning to exclude files globally
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '.husky/**',
      'public/**',
      '*.config.js',
      '*.config.ts',
      '.eslintrc.js',
      'next-env.d.ts',
      // Add any other patterns from your old .eslintignore file
    ],
  },
  ...fixupConfigRules(
    compat.extends(
      'next',
      'eslint:recommended',
      'prettier',
      'next/core-web-vitals',
      'plugin:@typescript-eslint/recommended',
      'plugin:react/recommended',
      'plugin:prettier/recommended',
      'plugin:react-hooks/recommended'
    )
  ),
  {
    plugins: {
      prettier: fixupPluginRules(prettier),
      '@typescript-eslint': fixupPluginRules(typescriptEslint),
      react: fixupPluginRules(react),
      'react-hooks': fixupPluginRules(reactHooks),
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },

      parser: tsParser,
      ecmaVersion: 2021,
      sourceType: 'module',

      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    settings: {
      react: {
        version: 'detect',
      },
    },

    rules: {
      'prefer-const': 'warn',
      'no-var': 'warn',
      'no-unused-vars': 'off',
      'object-shorthand': 'warn',
      'quote-props': ['warn', 'as-needed'],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error'],

      '@typescript-eslint/array-type': [
        'warn',
        {
          default: 'array',
        },
      ],

      '@typescript-eslint/consistent-type-assertions': [
        'warn',
        {
          assertionStyle: 'as',
          objectLiteralTypeAssertions: 'never',
        },
      ],

      'react/jsx-fragments': ['warn', 'syntax'],

      'react/jsx-filename-extension': [
        'warn',
        {
          extensions: ['ts', 'tsx'],
        },
      ],

      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'prettier/prettier': 'warn',
    },
  },
];

export default eslintConfig;
