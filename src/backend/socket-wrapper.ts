import * as WebSocket from 'ws';
import { MessageSender } from './message-sender.js';
import { Rendezvous } from './rendezvous.js';

export class SocketWrapper {

    private socket: WebSocket;
    private rndv: Rendezvous;
    readonly sender: MessageSender;

    constructor(socket: WebSocket, rndv: Rendezvous) {
        this.socket = socket;
        this.rndv = rndv;
        this.sender = new MessageSender(socket);
        this.socket.on('message', this.onMessage.bind(this));
        this.socket.on('close', this.onClose.bind(this));
    }

    onMessage(message: WebSocket.RawData) {
        const messageString = message.toString();
        this.rndv.setState(this, messageString);
    }

    onClose() {
        this.rndv.removeSocket(this);
    }

    close() {
        this.socket.close();
    }
}