import globals from 'globals';

export default [
    // Test files: Node + Vitest globals
    {
        files: ['tests/**/*.js'],
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: 'module',
            globals: {
                ...globals.node,
                describe: 'readonly',
                it: 'readonly',
                expect: 'readonly',
                vi: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                beforeAll: 'readonly',
                afterAll: 'readonly',
            },
        },
    },
    // Content scripts and popup: browser + chrome extension globals
    {
        files: ['javascripts/popup.js', 'javascripts/content_script.js', 'javascripts/deserialize.js'],
        languageOptions: {
            ecmaVersion: 2020,
            globals: {
                ...globals.browser,
                chrome: 'readonly',
                Mousetrap: 'readonly',
                $: 'readonly',
                jQuery: 'readonly',
                FILTER_BY_DOMAIN: 'readonly',
                getSetsForCurrentUrl: 'readonly',
                module: 'writable',
            },
        },
        rules: {
            'no-unused-vars': ['warn', { args: 'none', caughtErrorsIgnorePattern: '^_' }],
            'no-undef': 'error',
            'no-redeclare': 'error',
        },
    },
    // Service worker: has importScripts and utils globals (loaded via importScripts)
    {
        files: ['javascripts/background.js'],
        languageOptions: {
            ecmaVersion: 2020,
            globals: {
                ...globals.serviceworker,
                chrome: 'readonly',
                importScripts: 'readonly',
                parseUri: 'readonly',
                getSetsForCurrentUrl: 'readonly',
                FILTER_BY_DOMAIN: 'readonly',
                module: 'writable',
            },
        },
        rules: {
            'no-undef': 'error',
        },
    },
    // utils.js: shared utilities, getSetsForCurrentUrl is used by popup.js
    {
        files: ['javascripts/utils.js'],
        languageOptions: {
            ecmaVersion: 2020,
            globals: {
                ...globals.browser,
                chrome: 'readonly',
                parseUri: 'readonly',
                FILTER_BY_DOMAIN: 'writable',
                getSetsForCurrentUrl: 'writable',
                module: 'writable',
            },
        },
        rules: {
            'no-unused-vars': 'off',
            'no-undef': 'error',
        },
    },
];
