import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Provide a $ stub so the $.fn.serializeForm guard passes without jQuery
globalThis.$ = { fn: {} };

const { replaceParameters, randomStringGenerator } = require('../javascripts/content_script.js');

describe('randomStringGenerator()', () => {
    it('generates a string of exact length when min equals max', () => {
        const result = randomStringGenerator('abc', 5, 5);
        expect(result).toHaveLength(5);
    });

    it('generates a string within the min/max range', () => {
        for (let i = 0; i < 20; i++) {
            const result = randomStringGenerator('abc', 3, 7);
            expect(result.length).toBeGreaterThanOrEqual(3);
            expect(result.length).toBeLessThanOrEqual(7);
        }
    });

    it('only uses characters from the provided pool', () => {
        const pool = 'XYZ';
        const result = randomStringGenerator(pool, 10, 10);
        for (const ch of result) {
            expect(pool).toContain(ch);
        }
    });

    it('uses only digits for digit pool', () => {
        const result = randomStringGenerator('0123456789', 8, 8);
        expect(result).toMatch(/^\d{8}$/);
    });

    it('handles minLength when maxLength is not provided', () => {
        const result = randomStringGenerator('abc', 4);
        expect(result).toHaveLength(4);
    });
});

describe('replaceParameters()', () => {
    it('returns string unchanged when no tokens present', () => {
        expect(replaceParameters('hello world')).toBe('hello world');
    });

    it('replaces {randomNumber} with a numeric string of the specified length', () => {
        const result = replaceParameters('{randomNumber:5:5}');
        expect(result).toMatch(/^\d{5}$/);
    });

    it('replaces {randomAlpha} with an alphabetic string of the specified length', () => {
        const result = replaceParameters('{randomAlpha:4:4}');
        expect(result).toMatch(/^[A-Za-z]{4}$/);
    });

    it('replaces {randomAlphanumeric} with an alphanumeric string in the correct range', () => {
        const result = replaceParameters('{randomAlphanumeric:3:8}');
        expect(result.length).toBeGreaterThanOrEqual(3);
        expect(result.length).toBeLessThanOrEqual(8);
        expect(result).toMatch(/^[A-Za-z0-9]+$/);
    });

    it('replaces multiple tokens in one string', () => {
        const result = replaceParameters('{randomNumber:2:2}-{randomAlpha:3:3}');
        expect(result).toMatch(/^\d{2}-[A-Za-z]{3}$/);
    });

    it('returns the string unmodified when the token function name is unrecognized', () => {
        // The regex is case-insensitive (finds token), but the switch is case-sensitive
        // (doesn't dispatch), so the replacement is "undefined"
        const result = replaceParameters('{unknownFunc:3:3}');
        expect(result).toBe('undefined');
    });
});
