

var easyrtc_log = module.exports = {

    // The minimum log level to show. (debug|info|warning|error|none)
    logLevel: 'debug',

    logCallback: function(level, logText, logFields) {
        console[level](logText, logFields)
    }
};

/**
 * General logging function which emits a log event so long as the log level has a severity equal or greater than e.option.logLevel
 *
 * @param       {string} level          Log severity level. Can be ("debug"|"info"|"warning"|"error")
 * @param       {string} logText        Text for log.
 * @param       {?*} [logFields]        Simple JSON object which contains extra fields to be logged.
 */
easyrtc_log.log = function(level, logText, logFields, callback) {
    callback = callback || this.logCallback;

    switch (this.logLevel) {
        case "error":
            if (level !== "error") {
                break;
            }
            /* falls through */
        case "warning":
            if (level === "info") {
                break;
            }
            /* falls through */
        case "info":
            if (level === "debug") {
                break;
            }
            /* falls through */
        case "debug":
            callback(level, logText, logFields)
            break;
    }
};


/**
 * Convenience function for logging "debug" level items.
 *
 * @param       {string} logText        Text for log.
 * @param       {?*} [logFields]        Simple JSON object which contains extra fields to be logged.
 */
easyrtc_log.logDebug = function(logText, logFields) {
    easyrtc_log.log("debug", logText, logFields);
};


/**
 * Convenience function for logging "info" level items.
 *
 * @param       {string} logText        Text for log.
 * @param       {?*} [logFields]        Simple JSON object which contains extra fields to be logged.
 */
easyrtc_log.logInfo = function(logText, logFields) {
    easyrtc_log.log("info", logText, logFields);
};


/**
 * Convenience function for logging "warning" level items.
 *
 * @param       {string} logText        Text for log.
 * @param       {?*} [logFields]        Simple JSON object which contains extra fields to be logged.
 */
easyrtc_log.logWarning = function(logText, logFields) {
    easyrtc_log.log("warning", logText, logFields);
};


/**
 * Convenience function for logging "error" level items.
 *
 * @param       {string} logText        Text for log.
 * @param       {?*} [logFields]        Simple JSON object which contains extra fields to be logged.
 */
easyrtc_log.logError = function(logText, logFields) {
    easyrtc_log.log("error", logText, logFields);
};

module.exports = easyrtc_log;