import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { parseUri } = require('../javascripts/parseuri.js');

describe('parseUri', () => {
    it('parses protocol and host from a full URL', () => {
        const result = parseUri('https://example.com/path');
        expect(result.protocol).toBe('https');
        expect(result.host).toBe('example.com');
    });

    it('parses path from URL', () => {
        const result = parseUri('https://example.com/some/path');
        expect(result.path).toBe('/some/path');
    });

    it('parses query string', () => {
        const result = parseUri('https://example.com/page?foo=bar&baz=qux');
        expect(result.query).toBe('foo=bar&baz=qux');
    });

    it('parses query into queryKey object', () => {
        const result = parseUri('https://example.com/?foo=bar&baz=qux');
        expect(result.queryKey.foo).toBe('bar');
        expect(result.queryKey.baz).toBe('qux');
    });

    it('handles URL with no path', () => {
        const result = parseUri('https://example.com');
        expect(result.host).toBe('example.com');
        expect(result.protocol).toBe('https');
    });

    it('handles URL with port', () => {
        const result = parseUri('http://localhost:3000/app');
        expect(result.host).toBe('localhost');
        expect(result.port).toBe('3000');
        expect(result.path).toBe('/app');
    });
});
