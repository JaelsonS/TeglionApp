const Module = require('module');
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
    if (String(request).includes('@vitest/expect') || String(request).includes('vitest')) {
        console.error('[log-require] loading', request);
        console.error(new Error().stack);
    }
    return originalLoad.apply(this, arguments);
};
