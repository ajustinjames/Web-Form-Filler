import { createChromeMock } from './chrome-mock.js';

// Provide a default chrome mock for all tests
globalThis.chrome = createChromeMock();

// Stub Mousetrap so content_script.js can be imported without errors
globalThis.Mousetrap = {
    reset: vi.fn(),
    bind: vi.fn(),
};
