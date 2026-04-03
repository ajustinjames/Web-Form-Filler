import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// parseUri must be on globalThis before utils.js is required
const { parseUri } = require('../javascripts/parseuri.js');
globalThis.parseUri = parseUri;

const { fits, getSetsForCurrentUrl, FILTER_BY_DOMAIN, FILTER_BY_PATH, FILTER_BY_FULL } = require('../javascripts/utils.js');

import { createChromeMock } from './helpers/chrome-mock.js';

describe('fits()', () => {
    it('wildcard * matches any URL', () => {
        expect(fits('https://example.com/page', '*', FILTER_BY_DOMAIN)).toBe(true);
        expect(fits('https://anything.org/path', '*', FILTER_BY_PATH)).toBe(true);
    });

    describe('FILTER_BY_DOMAIN', () => {
        it('matches when hosts are the same', () => {
            expect(fits('https://example.com/page1', 'https://example.com/page2', FILTER_BY_DOMAIN)).toBe(true);
        });

        it('does not match different hosts', () => {
            expect(fits('https://example.com/page', 'https://other.com/page', FILTER_BY_DOMAIN)).toBe(false);
        });

        it('is case-insensitive', () => {
            expect(fits('https://EXAMPLE.COM/page', 'https://example.com/page', FILTER_BY_DOMAIN)).toBe(true);
        });
    });

    describe('FILTER_BY_PATH', () => {
        it('matches same host and path', () => {
            expect(fits('https://example.com/form', 'https://example.com/form', FILTER_BY_PATH)).toBe(true);
        });

        it('does not match different paths', () => {
            expect(fits('https://example.com/form', 'https://example.com/other', FILTER_BY_PATH)).toBe(false);
        });

        it('ignores query string differences', () => {
            expect(fits('https://example.com/form?x=1', 'https://example.com/form?y=2', FILTER_BY_PATH)).toBe(true);
        });
    });

    describe('FILTER_BY_FULL', () => {
        it('matches exact URL', () => {
            expect(fits('https://example.com/form?x=1', 'https://example.com/form?x=1', FILTER_BY_FULL)).toBe(true);
        });

        it('does not match different query strings', () => {
            expect(fits('https://example.com/form?x=1', 'https://example.com/form?x=2', FILTER_BY_FULL)).toBe(false);
        });

        it('does not match different paths', () => {
            expect(fits('https://example.com/a', 'https://example.com/b', FILTER_BY_FULL)).toBe(false);
        });
    });

    it('unknown filter value returns true (fallback)', () => {
        expect(fits('https://example.com', 'https://other.com', 'unknown')).toBe(true);
    });
});

describe('getSetsForCurrentUrl()', () => {
    beforeEach(() => {
        globalThis.chrome = createChromeMock({
            filter: FILTER_BY_DOMAIN,
            'set_1': { name: 'Form A', url: 'https://example.com/login', content: '{}' },
            'set_2': { name: 'Form B', url: 'https://other.com/login', content: '{}' },
        });
    });

    it('returns sets matching the current URL by domain', () => new Promise((resolve) => {
        getSetsForCurrentUrl('https://example.com/page', (sets) => {
            expect(sets).toHaveLength(1);
            expect(sets[0].name).toBe('Form A');
            resolve();
        });
    }));

    it('skips the filter key', () => new Promise((resolve) => {
        getSetsForCurrentUrl('https://example.com/page', (sets) => {
            const keys = sets.map(s => s.key);
            expect(keys).not.toContain('filter');
            resolve();
        });
    }));

    it('skips items without a url property', () => {
        globalThis.chrome = createChromeMock({
            filter: FILTER_BY_DOMAIN,
            'set_1': { name: 'No URL', content: '{}' },
        });
        return new Promise((resolve) => {
            getSetsForCurrentUrl('https://example.com', (sets) => {
                expect(sets).toHaveLength(0);
                resolve();
            });
        });
    });

    it('defaults to domain filter when filter key is absent', () => {
        globalThis.chrome = createChromeMock({
            'set_1': { name: 'Form A', url: 'https://example.com/login', content: '{}' },
        });
        return new Promise((resolve) => {
            getSetsForCurrentUrl('https://example.com/other', (sets) => {
                expect(sets).toHaveLength(1);
                resolve();
            });
        });
    });

    it('attaches key property to matched sets', () => new Promise((resolve) => {
        getSetsForCurrentUrl('https://example.com/page', (sets) => {
            expect(sets[0].key).toBe('set_1');
            resolve();
        });
    }));
});
