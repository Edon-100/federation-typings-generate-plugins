"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "Logger", {
    enumerable: true,
    get: function() {
        return Logger;
    }
});
let Logger = class Logger {
    static getLogger() {
        return this.loggerInstance;
    }
    static setLogger(logger) {
        this.loggerInstance = logger || console;
        return logger;
    }
};
Logger.loggerInstance = console;

//# sourceMappingURL=Logger.js.map