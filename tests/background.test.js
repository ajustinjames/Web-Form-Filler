import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import { createChromeMock } from './helpers/chrome-mock.js';

// Load parseUri and utils first so their globals are available
const { parseUri } = require('../javascripts/parseuri.js');
globalThis.parseUri = parseUri;

const { fits, getSetsForCurrentUrl, FILTER_BY_DOMAIN } = require('../javascripts/utils.js');
globalThis.fits = fits;
globalThis.getSetsForCurrentUrl = getSetsForCurrentUrl;
globalThis.FILTER_BY_DOMAIN = FILTER_BY_DOMAIN;

const { getHotkeys } = require('../javascripts/background.js');

describe('getHotkeys()', () => {
    beforeEach(() => {
        globalThis.chrome = createChromeMock({
            filter: FILTER_BY_DOMAIN,
            'set_1': { name: 'Form A', url: 'https://example.com', content: '{}', hotkey: 'ctrl+1' },
            'set_2': { name: 'Form B', url: 'https://example.com', content: '{}', hotkey: 'ctrl+2' },
            'set_3': { name: 'Form C', url: 'https://example.com', content: '{}' },
        });
    });

    it('returns hotkey strings from matching sets', () => new Promise((resolve) => {
        getHotkeys('https://example.com', (hotkeys) => {
            expect(hotkeys).toContain('ctrl+1');
            expect(hotkeys).toContain('ctrl+2');
            resolve();
        });
    }));

    it('skips sets without hotkeys', () => new Promise((resolve) => {
        getHotkeys('https://example.com', (hotkeys) => {
            expect(hotkeys).toHaveLength(2);
            resolve();
        });
    }));

    it('returns empty array when no sets match', () => new Promise((resolve) => {
        getHotkeys('https://no-match.com', (hotkeys) => {
            expect(hotkeys).toEqual([]);
            resolve();
        });
    }));

    it('returns empty array when matching sets have no hotkeys', () => {
        globalThis.chrome = createChromeMock({
            filter: FILTER_BY_DOMAIN,
            'set_1': { name: 'Form A', url: 'https://example.com', content: '{}' },
        });
        return new Promise((resolve) => {
            getHotkeys('https://example.com', (hotkeys) => {
                expect(hotkeys).toEqual([]);
                resolve();
            });
        });
    });
});
