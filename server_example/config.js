var fs      = require("fs");        // file system core module

module.exports = {
	httpServer: {
		protocol: process.env.HTTP_ONLY ? 'http' : 'https',
		port: process.env.PORT || (process.env.HTTP_ONLY ? '8080' : '8443'),
	    key:  fs.readFileSync(__dirname + "/certs/localhost.key"),
	    cert: fs.readFileSync(__dirname + "/certs/localhost.cert")
	},
	socketServer: {
	    "log level": 1,
	    // Whether to enable compatibility with Socket.IO v2 clients.
	    allowEIO3: true,
	    // Name of the HTTP cookie that contains the client sid to send as part of handshake response headers.
	    cookie: false,
	    // List of allowed transport methods for client connections
	    transports: ['polling', 'websocket'],
	    // Whether to allow transport upgrades (e.g., from polling to websocket)
	    allowUpgrades: true,
	    // How long to wait for pong response before disconnecting client (ms)
	    pingTimeout: 10000,
	    // How often to send ping packets to check connection (ms)
	    pingInterval: 5000,
	    // Time to allow for transport upgrade attempts (ms)
	    upgradeTimeout: 3000,
	    // Maximum allowed size for HTTP request buffer (bytes) - 1e6 = 1,000,000 bytes = 1MB
	    // Calculate: 1e6 = 1 * 10^6 = 1,000,000 bytes, or use 1024*1024 = 1,048,576 for exact 1MB
	    maxHttpBufferSize: 1e6,
	    // See Socket.io CORS documentation: 
	    // - https://socket.io/docs/v3/handling-cors/
	    cors: {
	        "origin": '*'
	    }
	}
}