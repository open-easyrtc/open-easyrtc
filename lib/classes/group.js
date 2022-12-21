

// Internals dependencies
var pub = require("./../easyrtc_public_obj"); // EasyRTC public object

// TODO migreate to ES6 or TypeScript
module.exports = function Group(appName, groupName, server) {

    var groupObj = {};

    /**
     * Expose all event functions
     */
    // TODO namespace filter;
    //groupObj.events = pub.events;

    /**
     * Expose all utility functions
     */
    // WHY ?
    //groupObj.util = pub.util;

    /**
     * NOT YET IMPLEMENTED - Returns an array of all connected clients within the room.
     *
     * @ignore
     * @param {function(?Error, Array.<string>)} callback Callback with error and array containing all easyrtcids.
     */
    groupObj.getConnections = function(callback) {
        var connectedEasyrtcidArray = Object.keys(server.app[appName].group[groupName].clientList);
        callback(null, connectedEasyrtcidArray);
    };

    return groupObj;
}