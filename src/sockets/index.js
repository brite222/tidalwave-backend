const { Server } = require('socket.io');
const { verifyAccess } = require('../utils/jwt');

module.exports = (httpServer) => {
  const io = new Server(httpServer, { cors: { origin: '*' } });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Auth required'));
    try {
      socket.user = verifyAccess(token);
      next();
    } catch { next(new Error('Invalid token')); }
  });

  io.on('connection', (socket) => {
    if (['admin', 'contractor'].includes(socket.user.role)) {
      socket.join('dashboard');
    }
    socket.join(`user:${socket.user.id}`);

    socket.on('disconnect', () => {});
  });

  return io;
};