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
            rndv.addSocket(ws, request.connection.remoteAddress);
        } else {
            new MessageSender(ws).sendFailureMessage("Rendezvous not found");
            ws.close();
            console.log("Failed connection attempt to " + request.url);
        }
    }

    createRendezvous(language: SupportedLanguage): string {
        const rndv = new Rendezvous(language);
        this.rndvs[rndv.id] = rndv;
        console.log("Rendezvous " + rndv.id + " started");
        return rndv.id;
    }

    rendezvousExists(id: string): boolean {
        return this.rndvs[id] !== undefined;
    }

    clearExpiredRendezvous() {
        const stats = new Statistics();
        Object.keys(this.rndvs).forEach(id => {
            const rndv = this.rndvs[id];
            if (rndv.isExpired()) {
                console.log("Rendezvous " + id + " expired");
                rndv.close();
                this.removeRendezvous(id);
                stats.inc('expired');
            } else if (rndv.isIdle()) {
                stats.inc('idle');
            } else {
                stats.inc('active');
            }
        });
        console.log("Rendezvous stats: " + JSON.stringify(stats.stats));
    }

    removeRendezvous(id: string) {
        delete this.rndvs[id];
    }
}

class Statistics {
    readonly stats: Record<string, number> = {};
    inc(key: string) {
        if (!this.stats[key]) {
            this.stats[key] = 0;
        }
        this.stats[key]++;
    }
}