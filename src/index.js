(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["./client"], function (CoCreateConfig) {
            return factory(CoCreateConfig)
        });
    } else if (typeof module === 'object' && module.exports) {
        const CoCreateConfig = require("./server.js")
        module.exports = factory(CoCreateConfig);
    } else {
        root.returnExports = factory(root["./client.js"]);
    }
}(typeof self !== 'undefined' ? self : this, function (CoCreateConfig) {
    return CoCreateConfig;
}));