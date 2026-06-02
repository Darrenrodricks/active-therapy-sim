import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import { attachSocket } from './socket.js';
import { log } from './utils/logger.js';

const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());

// Health check — handy when wiring up the iPad and you want to verify the
// server is reachable from another device on the network.
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'sensora-server', timestamp: Date.now() });
});

const httpServer = createServer(app);
attachSocket(httpServer);

httpServer.listen(PORT, () => {
  log.info(`SENSORA server listening on :${PORT}`);
  log.info(`  health → http://localhost:${PORT}/health`);
  log.info(`  socket → ws://localhost:${PORT}`);
});
