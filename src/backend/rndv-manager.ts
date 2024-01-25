import * as WebSocket from 'ws';
import { Rendezvous } from './rendezvous.js';
import { MessageSender } from './message-sender.js';
import { SupportedLanguage } from '../protocol.js';

export class RendezvousManager {

    private rndvs: Record<string, Rendezvous> = {};

    constructor(server: WebSocket.Server) {
        server.on('connection', this.onConnection.bind(this));
        setInterval(this.clearExpiredRendezvous.bind(this), 1000 * 60 * 60);
    }

    onConnection(ws: WebSocket, request: any) {
        const rndvId = request.url.split('/')[1];
        const rndv = this.rndvs[rndvId];
        if (rndv) {
            rndv.addSocket(ws);
            console.log("Connected " + request.url);
        } else {
            new MessageSender(ws).sendFailureMessage("Rendezvous not found");
            ws.close();
            console.log("Failed connection attempt to " + request.url);
        }
    }

    createRendezvous(language: SupportedLanguage): string {
        const rndv = new Rendezvous(language);
        this.rndvs[rndv.id] = rndv;
        return rndv.id;
    }

    rendezvousExists(id: string): boolean {
        return this.rndvs[id] !== undefined;
    }

    clearExpiredRendezvous() {
        Object.keys(this.rndvs).forEach(id => {
            const rndv = this.rndvs[id];
            if (rndv.isExpired()) {
                console.log("Rendezvous " + id + " expired");
                rndv.close();
                this.removeRendezvous(id);
            }
        });
    }

    removeRendezvous(id: string) {
        delete this.rndvs[id];
    }
}
