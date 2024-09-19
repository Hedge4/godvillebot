//! Commented out lines are for ES module syntax, but this project is CommonJS for now.

//// import globals from "globals";
//// import path from "node:path";
//// import { fileURLToPath } from "node:url";
//// import js from "@eslint/js";
//// import { FlatCompat } from "@eslint/eslintrc";

const globals = require('globals');
const js = require('@eslint/js');
const { FlatCompat } = require('@eslint/eslintrc');

//// const __filename = fileURLToPath(import.meta.url);
//// const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

//// export default [...compat.extends("eslint:recommended"), {
module.exports = [...compat.extends('eslint:recommended'), {
    languageOptions: {
        globals: {
            ...globals.node,
            totalGodpower: 'writable',
            usedDaily: 'writable',
            botBlocked: 'writable',
            xpBlocked: 'writable',
            suggestBlocked: 'writable',
            imageBlocked: 'writable',
            reactionRolesBlocked: 'writable',
        },

        ecmaVersion: 'latest',
        sourceType: 'commonjs',
    },

    rules: {
        'brace-style': ['error', '1tbs', {
            allowSingleLine: true,
        }],

        'comma-dangle': ['error', 'always-multiline'],
        'comma-spacing': 'error',
        'comma-style': 'error',
        curly: ['error', 'multi-line', 'consistent'],
        'dot-location': ['error', 'property'],
        'handle-callback-err': 'off',

        'max-nested-callbacks': ['error', {
            max: 4,
        }],

        'max-statements-per-line': ['error', {
            max: 2,
        }],

        'no-console': 'off',
        'no-empty-function': 'error',
        'no-floating-decimal': 'error',
        'no-lonely-if': 'error',
        'no-multi-spaces': 'error',

        'no-multiple-empty-lines': ['error', {
            max: 2,
            maxEOF: 1,
            maxBOF: 0,
        }],

        'no-shadow': ['error', {
            allow: ['err', 'resolve', 'reject'],
        }],

        'no-trailing-spaces': ['error'],
        'no-unused-vars': ['error', {
            'argsIgnorePattern': '^_',
            'varsIgnorePattern': '^_',
            'caughtErrorsIgnorePattern': '^_',
        }],
        'no-var': 'error',
        'object-curly-spacing': ['error', 'always'],
        'prefer-const': 'error',
        quotes: ['error', 'single'],
        semi: ['error', 'always'],
        'space-before-blocks': 'error',

        'space-before-function-paren': ['error', {
            anonymous: 'never',
            named: 'never',
            asyncArrow: 'always',
        }],

        'space-in-parens': 'error',
        'space-infix-ops': 'error',
        'space-unary-ops': 'error',
        yoda: 'error',
    },
}];