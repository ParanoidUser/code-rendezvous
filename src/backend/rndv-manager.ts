import * as WebSocket from 'ws';
import { Rendezvous } from './rendezvous.js';
import { MessageSender } from './message-sender.js';
import { SupportedLanguage } from '../protocol.js';

export class RendezvousManager {

    private rndvs: Record<string, Rendezvous> = {};
    private loggedStats: string = '';

    constructor(server: WebSocket.Server) {
        server.on('connection', this.onConnection.bind(this));
        setInterval(this.clearExpiredRendezvous.bind(this), 1000 * 60);
    }

    onConnection(ws: WebSocket, request: any) {
        const rndvId = request.url.split('/')[1];
        const rndv = this.rndvs[rndvId];
        if (rndv) {
            const forwarded = request.headers['x-forwarded-for'];
            const ip = forwarded ? forwarded.split(/,/)[0] : request.connection.remoteAddress;
            rndv.addSocket(ws, ip);
        } else {
            new MessageSender(ws).sendFailureMessage("Rendezvous not found");
            ws.close();
            console.log("Failed connection attempt to " + request.url);
        }
    }

    createRendezvous(language: SupportedLanguage): string {
        const rndv = new Rendezvous(language);
        this.rndvs[rndv.id] = rndv;
        console.log("Rendezvous " + rndv.id + "/" + language + "/ started");
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
        const statsStr = JSON.stringify(stats.stats);
        if (statsStr !== this.loggedStats) {
            this.loggedStats = statsStr;
            console.log("Rendezvous stats: " + statsStr);
        }
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