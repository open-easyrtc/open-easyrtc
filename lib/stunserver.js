/*
 * Copyright (c) 2011 Yutaka Takeda <yt0916 at gmail.com>
 * MIT Lincesed
 *
 * Permission is hereby granted, free of charge, to any person obtaining 
 * a copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the 
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in 
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

 /*
 * easyRTC - Our comments about this library
 * 
 * About:
 * The vast majority of this stun library is written by and copyright 
 * Yutaka Takeda. Only a few changes were made to make it work within the
 *  easyRTC framework.
 *
 * The software can be found at: https://github.com/enobufs/stun
 * This file is based on changes committed July 22, 2011
 * 
 * Changes (January 2013):
 *  - Implemented winston logging
 *  - Removed console messages
 * Changes (December 2012):
 *  - Removed the stun client library
 *  - Prepended console messages with "STUN: " (removed in January 2013)
 *  - Added ability to specify port numbers via a setter
 *  - Added this comment block
 *  - Copied portions of the readme.md to comment block below
 */
 
 /*
 # STUN server for Node.js

## Overview
STUN (Simple Traversal of UDP through NAT: RFC3489) is a protocol that allows a client node to obtain an external IP address and port number assigned by a NAT the client is behind. It can also identify behavioral type of the NAT. It is implemented in JavaScript to run with node.js. I started this work originally to learn node.js and JavaScript, however, this library may help other people who are interested in using STUN.

## System requirement
* Node.js v0.4 or above
* Two IP addresses on the same machine (for server)

# Limitations
* Current implementation does not support RFC 5389
* Following attributes are not supported
   * RESPONSE-ADDRESS
   * CHANGED-ADDRESS
   * USERNAME
   * PASSWORD
   * MESSAGE-INTEGRITY
   * ERROR-CODE
   * UNKNOWN-ATTRIBUTE
   * REFLECTED-FROM
   * XOR-MAPPED-ADDRESS (RFC3489bis)
*/
 
 
var dns = require('dns');
var dgram = require('dgram');
var crypto = require('crypto');

/**
 * @namespace
 * Recommended namespace for stun.js.
 * @name stun
 * @exports exports as stun
 * @example
 * var stun = require('stun');
 */

/**
 * Transport address dependency types.
 * <ul>
 * <li>stun.Type.I: "I" (Independent)</li>
 * <li>stun.Type.PD: "PD" (Port dependent)</li>
 * <li>stun.Type.AD: "AD" (Address dependent)</li>
 * <li>stun.Type.APD: "APD" (Address&Port Dependent)</li>
 * <li>stun.Type.UNDEF: "UNDEF" (Undefined)</li>
 * </ul>
 */
exports.Type = {
    /**
     * Independent. Returns a constant string value of "I".
     */
    get I() { return "I"; },
    /**
     * Port dependent. Returns a constant string value of "PD".
     */
    get PD() { return "PD"; },
    /**
     * Address dependent. Returns a constant string value of "AD".
     */
    get AD() { return "AD"; },
    /**
     * Address and port dependent. Returns a constant string value of "APD".
     */
    get APD() { return "APD" },
    /**
     * Type undefined/undetermined. Returns a constant string value of "UNDEF".
     */
    get UNDEF() { return "UNDEF"; }
}

/**
 * Discovery mode.
 * <ul>
 * <li>stun.Mode.FULL: 0</li>
 * <li>stun.Mode.NB_ONLY: 1</li>
 * </ul>
 */
exports.Mode = {
    /** Performs full NAT type discovery. Returns 0.*/
    get FULL() { return 0; },
    /** NAT binding discovery only. Returns 1. */
    get NB_ONLY() { return 1; }
}

/**
 * Result code.
 * <ul>
 * <li>stun.Result.OK: 0</li>
 * <li>stun.Result.HOST_NOT_FOUND: -1</li>
 * <li>stun.Result.UDP_BLOCKED: -2</li>
 * <li>stun.Result.NB_INCOMPLETE: -3</li>
 * </ul>
 */
exports.Result = {
    /** Successful. */
    get OK() { return 0; },
    /** Domain does not exit. (DNS name resolution failed.) */
    get HOST_NOT_FOUND() { return -1; },
    /** No reply from server. Server may be down. */
    get UDP_BLOCKED() { return -2; },
    /** Partial UDP blockage. NB type discovery was incomplete. */
    get NB_INCOMPLETE() { return -3; }
}

/**
 * StunMessage factory.
 * @type StunMessage
 */
exports.createMessage = function() {
    return new StunMessage();
};

/**
 * StunServer factory.
 * @type StunServer
 */
exports.createServer = function() {
    return new StunServer();
};

// Tools.
function inet_aton(a) {
    var d = a.split('.');
    return ((((((+d[0])*256)+(+d[1]))*256)+(+d[2]))*256)+(+d[3]);
}

function inet_ntoa(n) {
    var d = n%256;
    for (var i = 3; i > 0; i--) { 
        n = Math.floor(n/256);
        d = n%256 + '.' + d;
    }
    return d;
}

/** 
 * Constructor for StunMessage object.
 * @class
 * @see stun.createMessage()
 */
function StunMessage() {
    // Message types.
    var _mesgTypes = {
        "breq"  : 0x0001,
        "bres"  : 0x0101,
        "berr"  : 0x0111, // Not supported
        "sreq"  : 0x0002, // Not supported
        "sres"  : 0x0102, // Not supported
        "serr"  : 0x0112, // Not supported
    };

    // Attribute types.
    var _attrTypes = {
        // RFC 3489
        "mappedAddr"    : 0x0001,
        "respAddr"      : 0x0002, // Not supported
        "changeReq"     : 0x0003,
        "sourceAddr"    : 0x0004,
        "changedAddr"   : 0x0005, // Not supported
        "username"      : 0x0006, // Not supported
        "password"      : 0x0007, // Not supported
        "msgIntegrity"  : 0x0008, // Not supported
        "errorCode"     : 0x0009, // Not supported
        "unknownAttr"   : 0x000a, // Not supported
        "reflectedFrom" : 0x000b, // Not supported
        // RFC 3489bis
        "xorMappedAddr" : 0x0020, // Not supported
        // Proprietary.
        "timestamp"     : 0x0032, // <16:srv-delay><16:tx-timestamp>
    };

    var _families = { "ipv4" : 0x01 };

    var _type = _mesgTypes.breq;
    var _tid;
    var _attrs = [];

    var _checkAttrAddr = function(value) {
        if(value["family"] == undefined) {
            value["family"] = "ipv4"
        }
        if(value["port"] == undefined) {
            throw new Error("Port undefined");
        }
        if(value["addr"] == undefined) {
            throw new Error("Addr undefined");
        }
    };

    var _getMesgTypeByVal = function(val) {
        for(type in _mesgTypes) {
            if(_mesgTypes[type] == val) {
                return type;
            }
        }

        throw new Error("Type undefined: " + val);
    }

    var _getAttrTypeByVal = function(val) {
        for(type in _attrTypes) {
            if(_attrTypes[type] == val) {
                return type;
            }
        }

        throw new Error("Unknown attr value: " + val);
    }

    var _readAddr = function(ctx) {
        var family;
        var port;
        var addr;
        ctx.pos++; // skip first byte
        for (f in _families) {
            if(_families[f] == ctx.buf[ctx.pos]) {
                family = f;
                break;
            }
        }
        if(family == undefined) throw new Error("Unsupported family: " + ctx.buf[ctx.pos]);
        ctx.pos++;

        port = ctx.buf[ctx.pos++] << 8;
        port |= ctx.buf[ctx.pos++];

        // Bit operations can handle only 32-bit values.
        // Here needs to use multiplication instead of
        // shift/or operations to avoid inverting signedness.
        addr = ctx.buf[ctx.pos++] * 0x1000000;
        addr += ctx.buf[ctx.pos++] << 16;
        addr += ctx.buf[ctx.pos++] << 8;
        addr += ctx.buf[ctx.pos++];

        return { 'family': family, 'port': port, 'addr': inet_ntoa(addr) };
    };

    var _writeAddr = function(ctx, code, attrVal) {
        if(ctx.buf.length < ctx.pos + 12) throw new Error("Insufficient buffer");

        // Append attribute header.
        ctx.buf[ctx.pos++] = code >> 8;
        ctx.buf[ctx.pos++] = code & 0xff;
        ctx.buf[ctx.pos++] = 0x00;
        ctx.buf[ctx.pos++] = 0x08;

        // Append attribute value.
        ctx.buf[ctx.pos++] = 0x00;
        ctx.buf[ctx.pos++] = _families[attrVal.family];
        ctx.buf[ctx.pos++] = attrVal.port >> 8;
        ctx.buf[ctx.pos++] = attrVal.port & 0xff;

        var addr = inet_aton(attrVal.addr);
        ctx.buf[ctx.pos++] = addr >> 24;
        ctx.buf[ctx.pos++] = (addr >> 16) & 0xff;
        ctx.buf[ctx.pos++] = (addr >> 8) & 0xff;
        ctx.buf[ctx.pos++] = addr & 0xff;
    };

    var _readChangeReq = function(ctx) {
        ctx.pos += 3;
        var chIp = false;
        var chPort = false;
        if(ctx.buf[ctx.pos] & 0x4) { chIp = true; };
        if(ctx.buf[ctx.pos] & 0x2) { chPort = true; };
        ctx.pos++;

        return { 'changeIp': chIp, 'changePort': chPort };
    };

    var _writeChangeReq = function(ctx, attrVal) {
        if(ctx.buf.length < ctx.pos + 8) throw new Error("Insufficient buffer");

        // Append attribute header.
        ctx.buf[ctx.pos++] = _attrTypes.changeReq >> 8;
        ctx.buf[ctx.pos++] = _attrTypes.changeReq & 0xff;
        ctx.buf[ctx.pos++] = 0x00;
        ctx.buf[ctx.pos++] = 0x04;

        // Append attribute value.
        ctx.buf[ctx.pos++] = 0x00;
        ctx.buf[ctx.pos++] = 0x00;
        ctx.buf[ctx.pos++] = 0x00;
        ctx.buf[ctx.pos++] = ((attrVal.changeIp)? 0x4:0x0) | ((attrVal.changePort)? 0x2:0x0)
    };

    var _readTimestamp = function(ctx) {
        var respDelay;
        var timestamp;
        respDelay = ctx.buf[ctx.pos++] << 8
        respDelay |= ctx.buf[ctx.pos++]
        timestamp = ctx.buf[ctx.pos++] << 8
        timestamp |= ctx.buf[ctx.pos++]

        return { 'respDelay': respDelay, 'timestamp': timestamp };
    };

    var _writeTimestamp = function(ctx, attrVal) {
        if(ctx.buf.length < ctx.pos + 8) throw new Error("Insufficient buffer");

        // Append attribute header.
        ctx.buf[ctx.pos++] = _attrTypes.timestamp >> 8;
        ctx.buf[ctx.pos++] = _attrTypes.timestamp & 0xff;
        ctx.buf[ctx.pos++] = 0x00;
        ctx.buf[ctx.pos++] = 0x04;

        // Append attribute value.
        ctx.buf[ctx.pos++] = attrVal.respDelay >> 8;
        ctx.buf[ctx.pos++] = attrVal.respDelay & 0xff;
        ctx.buf[ctx.pos++] = attrVal.timestamp >> 8;
        ctx.buf[ctx.pos++] = attrVal.timestamp & 0xff;
    };

    /**
     * Initializes StunMessage object.
     */
    this.init = function() {
        _type = _mesgTypes.breq;
        _attrs = [];
    };

    /**
     * Sets STUN message type.
     * @param {string} type Message type.
     * @throws {RangeError} Unknown message type.
     */
    this.setType = function(type) {
        _type = _mesgTypes[type];
        if(_type < 0) throw new RangeError("Unknown message type");
    };

    /**
     * Gets STUN message type.
     * @throws {Error} Type undefined.
     * @type string
     */
    this.getType = function() {
        return _getMesgTypeByVal(_type);
    }

    /**
     * Sets transaction ID.
     * @param {string} tid 16-byte transaction ID.
     */
    this.setTransactionId = function(tid) {
        _tid = tid;
    };

    /**
     * Gets transaction ID.
     * @type string
     */
    this.getTransactionId = function() {
        return _tid;
    };

    /**
     * Adds a STUN attribute.
     * @param {string} attrType Attribute type.
     * @param {object} attrVal Attribute value. Structure of this
     * value varies depending on the type.
     * @throws {RangeError} Unknown attribute type.
     * @throws {Error} The 'changeIp' property is undefined.
     * @throws {Error} The 'changePort' property is undefined.
     */
    this.addAttribute = function(attrType, attrVal) {
        var code = _attrTypes[attrType];
        if(code < 0) throw new RangeError("Unknown attribute type");

        // Validate attrVal
        switch(code)
        {
            case 0x0001: // mappedAddr
            case 0x0002: // respAddr
            case 0x0004: // sourceAddr
            case 0x0005: // changedAddr
            case 0x0020: // xorMappedAddr
                _checkAttrAddr(attrVal);
                break;
            case 0x0003: // change-req
                if(attrVal["changeIp"] == undefined) {
                    throw new Error("change IP undefined");
                }
                if(attrVal["changePort"] == undefined) {
                    throw new Error("change Port undefined");
                }
                break;

            case 0x0032: // timestamp
                if(attrVal.respDelay > 0xffff) attrVal.respDealy = 0xffff;
                if(attrVal.timestamp > 0xffff) attrVal.timestamp = 0xffff;
                break;

            case 0x0006: // username
            case 0x0007: // password
            case 0x0008: // msgIntegrity
            case 0x0009: // errorCode
            case 0x000a: // unknownAttr
            case 0x000b: // reflectedFrom
            default:
                throw new Error("Unsupported attribute " + attrType);
        }

        // If the attribute type already exists, replace it with the new one.
        for(var i = 0; i < _attrs.length; ++i) {
            if(_attrs[i].type == attrType) {
                _attrs[i].value = attrVal;
                replaced = true;
                return;
            }
        }

        _attrs.push({type:attrType, value:attrVal});
    };

    /**
     * Gets a list of STUN attributes.
     * @type array
     */
    this.getAttributes = function() {
        return _attrs;
    }

    /**
     * Gets a STUN attributes by its type.
     * @param {string} attrType Attribute type.
     * @type object
     */
    this.getAttribute = function(attrType) {
        for(var i = 0; i < _attrs.length; ++i) {
            if(_attrs[i].type == attrType) {
                return _attrs[i].value;
            }
        }

        return null; // the attribute not found.
    }

    /**
     * Gets byte length a serialized buffer would be.
     * @throws {RangeError}  Unknown attribute type.
     * @type number
     */
    this.getLength = function() {
        var len = 20; // header size (fixed)
        for(var i = 0; i < _attrs.length; ++i) {
            var code = _attrTypes[_attrs[i].type];
            if(code < 0) throw new RangeError("Unknown attribute type");

            // Validate attrVal
            switch(code)
            {
                case 0x0001: // mappedAddr
                case 0x0002: // respAddr
                case 0x0004: // sourceAddr
                case 0x0005: // changedAddr
                case 0x0020: // xorMappedAddr
                    len += 12;
                    break;
                case 0x0003: // changeReq
                    len += 8;
                    break;

                case 0x0032: // timestamp
                    len += 8;
                    break;

                case 0x0006: // username
                case 0x0007: // password
                case 0x0008: // msgIntegrity
                case 0x0009: // errorCode
                case 0x000a: // unknownAttr
                case 0x000b: // reflectedFrom
                default:
                    throw new Error("Unsupported attribute: " + code);
            }
        }

        return len;
    };

    /**
     * Returns a serialized data of type Buffer.
     * @throws {Error} Incorrect transaction ID.
     * @throws {RangeError}  Unknown attribute type.
     * @type buffer
     */
    this.serialize = function() {
        var ctx = {
            buf: new Buffer(this.getLength()),
            pos: 0};

        // Write 'Type'
        ctx.buf[ctx.pos++] = _type >> 8;
        ctx.buf[ctx.pos++] = _type & 0xff;
        // Write 'Length'
        ctx.buf[ctx.pos++] = (ctx.buf.length - 20) >> 8;
        ctx.buf[ctx.pos++] = (ctx.buf.length - 20) & 0xff;
        // Write 'Transaction ID'
        if(_tid == undefined || _tid.length != 16) {
            throw new Error("Incorrect transaction ID");
        }
        for(var i = 0; i < 16; ++i) {
            ctx.buf[ctx.pos++] = _tid.charCodeAt(i);
        }

        for(var i = 0; i < _attrs.length; ++i) {
            var code = _attrTypes[_attrs[i].type];
            if(code < 0) throw new RangeError("Unknown attribute type");

            // Append attribute value
            switch(code) {
                case 0x0001: // mappedAddr
                case 0x0002: // respAddr
                case 0x0004: // sourceAddr
                case 0x0005: // changedAddr
                    _writeAddr(ctx, code, _attrs[i].value);
                    break;
                case 0x0003: // changeReq
                    _writeChangeReq(ctx, _attrs[i].value);
                    break;
                case 0x0032: // timestamp
                    _writeTimestamp(ctx, _attrs[i].value);
                    break;

                case 0x0006: // username
                case 0x0007: // password
                case 0x0008: // msgIntegrity
                case 0x0009: // errorCode
                case 0x000a: // unknownAttr
                case 0x000b: // reflectedFrom
                default:
                    throw new Error("Unsupported attribute");
            }
        }

        return ctx.buf;
    };

    /**
     * Deserializes a serialized data into this object.
     * @param {buffer} buffer Data to be deserialized.
     * @throws {Error} Malformed data in the buffer.
     */
    this.deserialize = function(buffer) {
        var ctx = {
            pos:0,
            buf:buffer
        };

        // Initialize.
        _type = 0;
        _tid = undefined;
        _attrs = [];

        // buffer must be >= 20 bytes.
        if(ctx.buf.length < 20)
            throw new Error("Malformed data");

        // Parse type.
        _type = ctx.buf[ctx.pos++] << 8;
        _type |= ctx.buf[ctx.pos++];

        // Parse length
        var len;
        len = ctx.buf[ctx.pos++] << 8;
        len |= ctx.buf[ctx.pos++];

        // Parse tid.
        _tid = ctx.buf.toString('binary', ctx.pos, ctx.pos + 16);
        ctx.pos += 16;

        // The remaining length should match the value in the length field.
        if(ctx.buf.length - 20 != len)
            throw new Error("Malformed data");

        while(ctx.pos < ctx.buf.length) {
            // Remaining size in the buffer must be >= 4.
            if(ctx.buf.length - ctx.pos < 4)
                throw new Error("Malformed data");

            var attrLen;
            var code;

            code = ctx.buf[ctx.pos++] << 8;
            code |= ctx.buf[ctx.pos++];
            attrLen = ctx.buf[ctx.pos++] << 8;
            attrLen |= ctx.buf[ctx.pos++];

            // Remaining size must be >= attrLen.
            if(ctx.buf.length - ctx.pos < attrLen)
                throw new Error("Malformed data: code=" + code + " rem=" + (ctx.buf.length - ctx.pos) + " len=" + attrLen);


            var attrVal;

            switch(code) {
                case 0x0001: // mappedAddAr
                case 0x0002: // respAddr
                case 0x0004: // sourceAddr
                case 0x0005: // changedAddr
                    if(attrLen != 8) throw new Error("Malformed data");
                    attrVal = _readAddr(ctx);
                    break;
                case 0x0003: // changeReq
                    if(attrLen != 4) throw new Error("Malformed data");
                    attrVal = _readChangeReq(ctx);
                    break;
                case 0x0032: // xorMappedAddr
                    if(attrLen != 4) throw new Error("Malformed data");
                    attrVal = _readTimestamp(ctx);
                    break;
                case 0x0006: // username
                case 0x0007: // password
                case 0x0008: // msgIntegrity
                case 0x0009: // errorCode
                case 0x000a: // unknownAttr
                case 0x000b: // reflectedFrom
                default:
                    // We do not know of this type.
                    // Skip this attribute.
                    ctx.pos += attrLen;
                    continue;
            }

            _attrs.push({type:_getAttrTypeByVal(code), value:attrVal});
        }
    };
}


/////////////////////////////////////////////////////////////////////

/** 
 * Constructor for StunServer object.
 * To instantiate a StunServer object, use createServer() function.
 * @class
 * @see stun.createServer()
 */
function StunServer() {
    // Private: 
    var _addr0;
    var _addr1;
    var _port0 = 3478;
    var _port1 = 3479;
    var _sockets = [];
    var _stats = {
        numRcvd: 0,
        numSent: 0,
        numMalformed: 0,
        numUnsupported: 0,
    };

    var winston = require('winston');
    var logStun = winston.loggers.get('stun');


    var _now = function() { return (new Date()).getTime(); };

    var _onListening = function(sid) {
        var sin = _sockets[sid].address();
        logStun.info("Stun Server (soc [" + sid + "]) listening on " + sin.address + ":" + sin.port, { label: 'Stun'});
    };

    var _onReceived = function(sid, msg, rinfo) {
        logStun.debug("Stun (soc [" + sid + "]) message received from " + rinfo.address + ":" + rinfo.port, { label: 'Stun'});

        var stunmsg = new StunMessage();
        var fid = sid; // source socket ID for response

        _stats.numRcvd++;

        try {
            stunmsg.deserialize(msg);
        }
        catch(e) {
            _stats.numMalformed++;
            logStun.error("Stun Server Error: " + e.message, { label: 'Stun'});
            return;
        }

        // We are only interested in binding request.
        if(stunmsg.getType() != 'breq') {
            _stats.numUnsupported++;
            return;
        }

        var val;

        // Modify source socket ID (fid) based on 
        // CHANGE-REQUEST attribute.
        val = stunmsg.getAttribute('changeReq');
        if(val != undefined) {
            if(val.changeIp) {
                fid ^= 0x2;
            }
            if(val.changePort) {
                fid ^= 0x1;
            }
        }

        // Check if it has timestamp attribute.
        var txTs;
        var rcvdAt = _now();
        val = stunmsg.getAttribute('timestamp');
        if(val != undefined) {
            txTs = val.timestamp;
        }

        try {
            // Initialize the message object to reuse.
            // The init() does not reset transaction ID.
            stunmsg.init();
            stunmsg.setType('bres');

            // Add mapped address.
            stunmsg.addAttribute(
                    'mappedAddr', {
                        'family': 'ipv4', 
                        'port': rinfo.port,
                        'addr': rinfo.address});

            // Offer CHANGED-ADDRESS only when _addr1 is defined.
            if(_addr1 != undefined) {
                var chAddr = (sid & 0x2)?_addr0:_addr1;
                var chPort = (sid & 0x1)?_port0:_port1;

                stunmsg.addAttribute(
                    'changedAddr', {
                        'family': 'ipv4', 
                        'port': chPort,
                        'addr': chAddr});
            }

            var soc = _sockets[fid];

            // Add source address.
            stunmsg.addAttribute(
                    'sourceAddr', {
                        'family': 'ipv4', 
                        'port': soc.address().port,
                        'addr': soc.address().address});

            // Add timestamp if existed in the request.
            if(txTs != undefined) {
                stunmsg.addAttribute(
                    'timestamp', {
                        'respDelay': ((_now() - rcvdAt) & 0xffff), 
                        'timestamp': txTs});
            }

            var resp = stunmsg.serialize();
            if(soc == undefined) throw new Error("Invalid from ID: " + fid);
            logStun.debug("Stun (soc [" + sid + "]) sending "  + resp.length + " bytes to " + rinfo.address + ":" + rinfo.port, { label: 'Stun'});
            soc.send(   resp,
                        0,
                        resp.length,
                        rinfo.port,
                        rinfo.address);
        }
        catch(e) {
            _stats.numMalformed++;
            logStun.info("Stun Error: " + e.message, { label: 'Stun'});
        }

        _stats.numSent++;
    };

    var _getPort = function(sid) {
        return (sid & 1)?_port1:_port0;
    };

    var _getAddr = function(sid) {
        return (sid & 2)?_addr1:_addr0;
    };

    // Public: 

    /**
     * Sets primary server address.
     * @param {string} addr0 Dotted decimal IP address.
     */
    this.setAddress0 = function(addr0) {
        _addr0 = addr0;
    };

    /**
     * Sets secondary server address.
     * @param {string} addr1 Dotted decimal IP address.
     */
    this.setAddress1 = function(addr1) {
        _addr1 = addr1;
    };

    /**
     * Sets first port number.
     * @param {string} port0 Integer port number. Defaults to 3478
     */
    this.setPort0 = function(port0) {
        _port0 = port0;
    };

    /**
     * Sets second port number.
     * @param {string} port1 Integer port number. Defaults to 3479
     */
    this.setPort1 = function(port1) {
        _port1 = port1;
    };

    /**
     * Starts listening to STUN requests from clients.
     * @throws {Error} Server address undefined.
     */
    this.listen = function() {
        // Sanity check
        if(_addr0 == undefined) throw new Error("Address undefined");
        if(_addr1 == undefined) throw new Error("Address undefined");

        for(var i = 0; i < 4; ++i) {
            // Create socket and add it to socket array.
            var soc = dgram.createSocket("udp4");
            _sockets.push(soc);


            switch(i) {
                case 0:
                    soc.on("listening", function () { _onListening(0); });
                    soc.on("message", function (msg, rinfo) { _onReceived(0, msg, rinfo); });
                    soc.on('error', function (err) {
                        if (err.code == 'EADDRNOTAVAIL') { logStun.error('Stun ERROR - Address not available [' + _getAddr(0) + ':' + _getPort(0) + ']' , {label: 'Stun',data: err}); }
                        else { logStun.error("Stun ERROR", {label: 'Stun',data: err}); }
                        setTimeout(function() {process.exit(1);}, 100);
                    });
                    break;
                case 1:
                    soc.on("listening", function () { _onListening(1); });
                    soc.on("message", function (msg, rinfo) { _onReceived(1, msg, rinfo); });
                    soc.on('error', function (err) {
                        if (err.code == 'EADDRNOTAVAIL') { logStun.error('Stun ERROR - Address not available [' + _getAddr(1) + ':' + _getPort(1) + ']' , {label: 'Stun',data: err}); }
                        else { logStun.error("Stun ERROR", {label: 'Stun',data: err}); }
                        setTimeout(function() {process.exit(1);}, 100);
                    });
                    break;
                case 2:
                    soc.on("listening", function () { _onListening(2); });
                    soc.on("message", function (msg, rinfo) { _onReceived(2, msg, rinfo); });
                    soc.on('error', function (err) {
                        if (err.code == 'EADDRNOTAVAIL') { logStun.error('Stun ERROR - Address not available [' + _getAddr(2) + ':' + _getPort(2) + ']' , {label: 'Stun',data: err}); }
                        else { logStun.error("Stun ERROR", {label: 'Stun',data: err}); }
                        setTimeout(function() {process.exit(1);}, 100);
                    });
                    break;
                case 3:
                    soc.on("listening", function () { _onListening(3); });
                    soc.on("message", function (msg, rinfo) { _onReceived(3, msg, rinfo); });
                    soc.on('error', function (err) {
                        if (err.code == 'EADDRNOTAVAIL') { logStun.error('Stun ERROR - Address not available [' + _getAddr(3) + ':' + _getPort(3) + ']' , {label: 'Stun',data: err}); }
                        else { logStun.error("Stun ERROR", {label: 'Stun',data: err}); }
                        setTimeout(function() {process.exit(1);}, 100);
                    });
                    break;
                default:
                    throw new RangeError("Out of socket array");
            }


            // Start listening.
            soc.bind(_getPort(i), _getAddr(i));
        }
    };

    /**
     * Closes the STUN server.
     */
    this.close = function() {
        while(_sockets.length > 0) {
            var soc = _sockets.shift();
            var sin = soc.address();
            logStun.info("Stun server closing socket on " + sin.address + ":" + sin.port, { label: 'Stun'});
            soc.close();
        }
    };
}
