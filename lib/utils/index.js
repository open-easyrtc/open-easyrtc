
// Internals dependencies
var utils_error = require("./error");
var utils_log = require("./log");
var utils_easyrtc = require("./easyrtc");
var utils_package = require("./package");

/**
 *  Object to hold Utility methods and classes.
 *
 * @class
 */
module.exports = {
    ...utils_error,
    ...utils_log,
    ...utils_easyrtc,
    ...utils_package,

    get logLevel() {
        return utils_log.logLevel;
    },
    set logLevel(level) {
        utils_log.logLevel = level;
    },
    get logCallback() {
        return utils_log.logCallback;
    },
    set logCallback(callback) {
        utils_log.logCallback = callback;
    }
};