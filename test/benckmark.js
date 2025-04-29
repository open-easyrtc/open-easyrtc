const io = require('socket.io-client');

class ConnectionBenchmark {
  constructor(host, port, maxConnections) {
    this.serverUrl = `ws://${host}:${port}`;
    this.maxConnections = maxConnections;
    this.activeConnections = 0;
    this.failedConnections = 0;
    this.startTime = null;
  }

  async run() {
    this.startTime = Date.now();
    console.log(`Starting benchmark: ${this.maxConnections} connections to ${this.serverUrl}`);

    for (let i = 0; i < this.maxConnections; i++) {
      this.createConnection(i);
      // Small delay to prevent overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  createConnection(id) {
    const client = io(this.serverUrl, {
      'force new connection': true,
      reconnection: false,
      transports: ['websocket'],
      extraHeaders: {
        origin: this.serverUrl
      }
    });

    client.on('connect', () => {
      this.activeConnections++;
      console.log(`Connection ${id} established. Active: ${this.activeConnections}`);
      
      const authMsg = {
        msgType: 'authenticate',
        msgData: {
          apiVersion: "1.0.11",
          applicationName: "sylaps.com",
          username: `test ${id}`,
          setPresence: {
              show: 'chat',
              status: ''
          }
        }
      };

      client.emit('easyrtcAuth', authMsg, (response) => {
        if (response.msgType === 'error') {
          console.error(`Authentication failed for connection ${id}:`, response);
          this.failedConnections++;
          client.disconnect();
        } else {
          const dataToShip = {
            msgType: 'roomJoin',
            msgData: {
              roomJoin: {
                'test': {
                  roomName: 'test',
                  roomParameters: {},
                }
              }
            }
          }
          client.emit('easyrtcCmd', dataToShip, (response) => {
            if (response.msgType === 'error') {
              console.error(`Join room failed for connection ${id}:`, response);
            } else {

            }

          })
        }
      });
    });

    client.on('connect_error', (error) => {
      console.error(`Connection ${id} failed:`, error);
      this.failedConnections++;
      this.checkCompletion();
    });

    client.on('disconnect', () => {
      this.activeConnections--;
      this.checkCompletion();
    });
  }

  checkCompletion() {
    if (this.activeConnections + this.failedConnections === this.maxConnections) {
      const duration = (Date.now() - this.startTime) / 1000;
      console.log('\nBenchmark completed:');
      console.log(`Successful connections: ${this.activeConnections}`);
      console.log(`Failed connections: ${this.failedConnections}`);
      console.log(`Duration: ${duration.toFixed(2)} seconds`);
    }
  }
}

// Usage
const SERVER_HOST = 'localhost';
const SERVER_PORT = '8080'; // Replace with actual port
const MAX_CONNECTIONS = 100; // Adjust as needed

const benchmark = new ConnectionBenchmark(SERVER_HOST, SERVER_PORT, MAX_CONNECTIONS);
benchmark.run();