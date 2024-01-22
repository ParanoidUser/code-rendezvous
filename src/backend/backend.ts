import express from 'express';
import path from 'path';
import http from 'http';
import * as WebSocket from 'ws';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { ChannelManager } from './wsockets.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.WebSocketServer({ server: server });
const channelManager = new ChannelManager(wss);

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, '../public')));

app.get('/start', function(req, res) {
    const id = channelManager.createChannel();
    res.redirect(`/${id}`);
});

app.get('/:id', function(req, res) {
    const id = req.params.id;
    if(!channelManager.channelExists(id)) {
        return res.status(404).sendFile(path.join(__dirname, `../public/404.html`));
    }
    res.sendFile(path.join(__dirname, `../public/editor.html`));
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, function() {
    console.log(`Server is running on port ${PORT}`);
});