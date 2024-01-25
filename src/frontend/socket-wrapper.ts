import { Rendezvous } from "./rendezvous";
import { StatusMessage, keepAliveState } from '../protocol';

export class SocketWrapper {

    private socket: WebSocket;
    private rndv: Rendezvous;
    private lastUpdateTimestamp: number = 0;

    constructor(rndv: Rendezvous) {
        this.rndv = rndv;
        console.log('Establishing connection...');
        this.socket = new WebSocket(window.location.href.replace('http', 'ws'));
        this.socket.onopen = this.onOpen.bind(this);
        this.socket.onmessage = this.onMessage.bind(this);
        this.socket.onerror = this.onError.bind(this);
        this.socket.onclose = this.onClose.bind(this);
    }

    onOpen() {
        this.rndv.showConnectionStatus(true);
        console.log('Connection established.');
        this.lastUpdateTimestamp = Date.now();
    }

    onMessage(event: MessageEvent) {
        const message: StatusMessage = JSON.parse(event.data);
        //console.log('Received:', message);
        if (message.type === 'keep-alive') {
            this.lastUpdateTimestamp = Date.now();
        } else {
            this.rndv.dispatchStatusMessage(message);
        }
    }

    onError(error: Event) {
        console.error('Retriable error:', error);
        this.rndv.clearSocket();
        this.rndv.showConnectionStatus(false, "Connection error");
        this.lastUpdateTimestamp = 0;
    }

    onClose() {
        console.log('Connection closed.');
        this.rndv.clearSocket();
        this.lastUpdateTimestamp = 0;
    }

    isOpen(): boolean {
        return this.socket.readyState === this.socket.OPEN;
    }

    send(message: string) {
        this.socket.send(message);
        this.lastUpdateTimestamp = Date.now();
    }

    close() {
        this.socket.close();
    }

    keepAlive() {
        if (this.isOpen()) {
            if (Date.now() - this.lastUpdateTimestamp > 30000) {
                this.send(JSON.stringify(keepAliveState));
            }
        }
    }
}