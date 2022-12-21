

// Internals dependencies
var easyrtc = require("./../easyrtc_private_obj"); // EasyRTC private object
var pub = require("./../easyrtc_public_obj"); // EasyRTC public object

module.exports = function Group(appName, groupName) {

    var groupObj = {};

    /**
     * Expose all event functions
     */
    //groupObj.events = pub.events;

    /**
     * Expose all utility functions
     */
    //groupObj.util = pub.util;

    /**
     * NOT YET IMPLEMENTED - Returns an array of all connected clients within the room.
     *
     * @ignore
     * @param {function(?Error, Array.<string>)} callback Callback with error and array containing all easyrtcids.
     */
    groupObj.getConnections = function(callback) {
        var connectedEasyrtcidArray = Object.keys(easyrtc.app[appName].group[groupName].clientList);
        callback(null, connectedEasyrtcidArray);
    };

    return groupObj;
}