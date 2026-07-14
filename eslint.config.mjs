import eslintConfigPrettier from '@electron-toolkit/eslint-config-prettier';
import tseslint from '@electron-toolkit/eslint-config-ts';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import eslintPluginReact from 'eslint-plugin-react';
import eslintPluginReactHooks from 'eslint-plugin-react-hooks';
import eslintPluginReactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

export default [
  // Global ignores
  {
    ignores: ['dist/', 'out/', '.changeset/', '.vite/', '.tanstack/'],
  },

  // Base config for all files
  ...tseslint.configs.recommended,

  // Type-checked rules for all source and test files. Covering tests means
  // no-floating-promises catches an unawaited Playwright assertion, the
  // classic E2E bug that tsc alone does not flag
  {
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.ts'],
    ...tseslint.configs.recommendedTypeChecked[0],
    languageOptions: {
      ...tseslint.configs.recommendedTypeChecked[0].languageOptions,
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      // Additional TypeScript strictness
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'warn',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],
      '@typescript-eslint/consistent-type-exports': 'error',
      // Additional async/promise handling
      '@typescript-eslint/promise-function-async': 'error',
      '@typescript-eslint/require-await': 'error',
      'no-async-promise-executor': 'error',
      // Import organization
      'no-duplicate-imports': 'error',
      // Code quality
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }], // Enforces strict equality operators
      // Discourage enums in favor of const objects
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message: 'Use const objects instead of enums for better tree-shaking',
        },
      ],
    },
  },

  // Main process (Node.js only)
  {
    files: ['src/main/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Node-specific rules
      '@typescript-eslint/no-var-requires': 'error',
      // Security rules for Electron main process
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      // No console output in main process
      'no-console': 'error',
    },
  },

  // Preload scripts (Node.js & Browser)
  {
    files: ['src/preload/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
  },

  // Renderer (Browser / React)
  {
    files: ['src/renderer/**/*.{ts,tsx}'],
    ...eslintPluginReact.configs.flat.recommended,
    ...eslintPluginReact.configs.flat['jsx-runtime'],
    ...jsxA11y.flatConfigs.recommended,
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    plugins: {
      react: eslintPluginReact,
      'react-hooks': eslintPluginReactHooks,
      'react-refresh': eslintPluginReactRefresh,
    },
    settings: {
      react: {
        // Not 'detect': eslint-plugin-react's version detection calls an API
        // removed in eslint 10 and crashes. Pin until the fix from
        // https://github.com/jsx-eslint/eslint-plugin-react/pull/3979 ships.
        version: '19.2',
      },
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': [
        'warn',
        {
          allowConstantExport: true,
          // TanStack Router's route factories wrap the route component
          // and handle HMR for it themselves
          extraHOCs: ['createFileRoute', 'createRootRouteWithContext'],
        },
      ],
      // React 19 optimizations
      'react/prop-types': 'off', // Not needed with TypeScript
      'react/no-array-index-key': 'warn',
      'react/jsx-no-leaked-render': 'warn',
      'react/jsx-key': ['error', { checkFragmentShorthand: true }],
      'react/self-closing-comp': 'error',
      'react/jsx-curly-brace-presence': [
        'error',
        { props: 'never', children: 'never' },
      ],
      'react/jsx-boolean-value': ['error', 'never'],
      // Allow async event handlers (common with React Query)
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
      // No console output in renderer
      'no-console': 'error',
    },
  },

  // Build and CI scripts (plain Node ESM, not part of the app)
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Plain JavaScript, so TypeScript-only return type annotations do not apply
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },

  // Prettier must be last
  eslintConfigPrettier,
];
