/* global module, require */

/**
 * @file        Maintains private object used within EasyRTC for holding in-memory state information
 * @module      easyrtc_private_obj
 * @author      Open-EasyRTC
 * @copyright   Copyright 2022 Open-EasyRTC. All rights reserved.
 * @license     BSD v2, see LICENSE file in module root folder.
 */

// TODO migreate to ES6 or TypeScript
module.exports = function Group(appName, groupName, server) {

    var groupObj = {};

    /**
     * Expose all event functions
     */
    // TODO namespace filter;
    //groupObj.events = server.events;

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