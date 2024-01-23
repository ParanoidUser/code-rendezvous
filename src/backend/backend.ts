import express from 'express';
import path from 'path';
import http from 'http';
import * as WebSocket from 'ws';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { RendezvousManager } from './rndv-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.WebSocketServer({ server });
const rndvManager = new RendezvousManager(wss);

// Serve static files from the "public" directory
const publicDir = path.join(__dirname, '../../public');
app.use(express.static(publicDir));

app.get('/start', function(req, res) {
    const id = rndvManager.createRendezvous();
    res.redirect(`/${id}`);
});

app.get('/:id', function(req, res) {
    const id = req.params.id;
    if(!rndvManager.rendezvousExists(id)) {
        return res.status(404).sendFile(path.join(publicDir, `404.html`));
    }
    res.sendFile(path.join(publicDir, `editor.html`));
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, function() {
    console.log(`Server is running on port ${PORT}`);
});