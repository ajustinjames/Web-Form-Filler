/**
 * Creates a mock chrome API object for use in tests.
 * @param {Object} storageData - Initial storage contents
 */
export function createChromeMock(storageData = {}) {
    const storage = { ...storageData };

    return {
        storage: {
            local: {
                get: vi.fn((keys, cb) => {
                    if (keys === null || keys === undefined) {
                        cb({ ...storage });
                    } else if (typeof keys === 'string') {
                        cb({ [keys]: storage[keys] });
                    } else if (Array.isArray(keys)) {
                        const result = {};
                        for (const k of keys) result[k] = storage[k];
                        cb(result);
                    } else {
                        cb({ ...storage });
                    }
                }),
                set: vi.fn((items, cb) => {
                    Object.assign(storage, items);
                    if (cb) cb();
                }),
                remove: vi.fn((keys, cb) => {
                    const toRemove = Array.isArray(keys) ? keys : [keys];
                    for (const k of toRemove) delete storage[k];
                    if (cb) cb();
                }),
            },
        },
        tabs: {
            query: vi.fn((opts, cb) => cb([{ id: 1, url: 'https://example.com' }])),
            sendMessage: vi.fn((tabId, msg, cb) => { if (cb) cb({}); }),
        },
        runtime: {
            onMessage: { addListener: vi.fn() },
            sendMessage: vi.fn((msg, cb) => { if (cb) cb({}); }),
            lastError: null,
        },
    };
}
