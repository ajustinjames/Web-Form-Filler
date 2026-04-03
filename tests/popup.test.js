import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Prevent popup.js startup side effects:
// - Null out chrome.tabs so the chrome.tabs.query guard is skipped at load time
// - Leave $ undefined so the $(document).ready guard is skipped
globalThis.chrome = { ...globalThis.chrome, tabs: null };

// Globals referenced by popup.js functions at call time
globalThis.getSetsForCurrentUrl = vi.fn();
globalThis.FILTER_BY_DOMAIN = 'domain';
globalThis.parseUri = vi.fn();

const { sortBy, validateSetSettings, escapeHtml, getRandomStorageId } = require('../javascripts/popup.js');

describe('sortBy()', () => {
    it('sorts ascending by property', () => {
        const items = [{ name: 'c' }, { name: 'a' }, { name: 'b' }];
        items.sort(sortBy('name'));
        expect(items.map(i => i.name)).toEqual(['a', 'b', 'c']);
    });

    it('sorts descending when property is prefixed with -', () => {
        const items = [{ name: 'a' }, { name: 'c' }, { name: 'b' }];
        items.sort(sortBy('-name'));
        expect(items.map(i => i.name)).toEqual(['c', 'b', 'a']);
    });

    it('returns 0 for equal values', () => {
        const cmp = sortBy('name');
        expect(cmp({ name: 'x' }, { name: 'x' })).toBe(0);
    });
});

describe('validateSetSettings()', () => {
    it('returns true for a valid minimal object', () => {
        expect(validateSetSettings({ content: '{}', url: 'https://example.com', name: 'Test' })).toBe(true);
    });

    it('returns true when all optional fields are present with correct types', () => {
        expect(validateSetSettings({
            content: '{}',
            url: 'https://example.com',
            name: 'Test',
            hotkey: 'ctrl+1',
            submitQuery: 'button[type=submit]',
            autoSubmit: true,
        })).toBe(true);
    });

    it('returns false for null', () => {
        expect(validateSetSettings(null)).toBe(false);
    });

    it('returns false for an array', () => {
        expect(validateSetSettings([])).toBe(false);
    });

    it('returns false for a non-object', () => {
        expect(validateSetSettings('string')).toBe(false);
    });

    it('returns false when content is missing', () => {
        expect(validateSetSettings({ url: 'https://example.com', name: 'Test' })).toBe(false);
    });

    it('returns false when content is not a string', () => {
        expect(validateSetSettings({ content: 123, url: 'https://example.com', name: 'Test' })).toBe(false);
    });

    it('returns false when hotkey is present but not a string', () => {
        expect(validateSetSettings({ content: '{}', url: 'https://example.com', name: 'Test', hotkey: 42 })).toBe(false);
    });

    it('returns false when autoSubmit is present but not a boolean', () => {
        expect(validateSetSettings({ content: '{}', url: 'https://example.com', name: 'Test', autoSubmit: 'yes' })).toBe(false);
    });

    it('returns false when unknown keys are present', () => {
        expect(validateSetSettings({ content: '{}', url: 'https://example.com', name: 'Test', extra: 'field' })).toBe(false);
    });
});

describe('escapeHtml()', () => {
    it('escapes &', () => {
        expect(escapeHtml('a & b')).toBe('a &amp; b');
    });

    it('escapes <', () => {
        expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
    });

    it('escapes >', () => {
        expect(escapeHtml('a > b')).toBe('a &gt; b');
    });

    it('escapes "', () => {
        expect(escapeHtml('"quoted"')).toBe('&quot;quoted&quot;');
    });

    it("escapes '", () => {
        expect(escapeHtml("it's")).toBe('it&#039;s');
    });

    it('returns empty string for falsy input', () => {
        expect(escapeHtml('')).toBe('');
        expect(escapeHtml(null)).toBe('');
        expect(escapeHtml(undefined)).toBe('');
    });

    it('returns string unchanged when no special characters', () => {
        expect(escapeHtml('hello world')).toBe('hello world');
    });
});

describe('getRandomStorageId()', () => {
    it('returns a string starting with set_', () => {
        expect(getRandomStorageId()).toMatch(/^set_/);
    });

    it('returns unique values on successive calls', () => {
        const ids = new Set(Array.from({ length: 20 }, () => getRandomStorageId()));
        expect(ids.size).toBe(20);
    });
});
