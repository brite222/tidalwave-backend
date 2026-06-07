const http = require('http');
const app = require('./app');
const env = require('./config/env');
const initSockets = require('./sockets');

const server = http.createServer(app);
const io = initSockets(server);
app.set('io', io);

const HOST = '0.0.0.0';
server.listen(env.PORT, HOST, () => {
  console.log(`🌊 TidalWave API running on port ${env.PORT}`);
});