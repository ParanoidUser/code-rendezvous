import { Rendezvous } from "./rendezvous";
import { StatusMessage } from '../protocol';

export class SocketWrapper {

    private socket: WebSocket;
    private rndv: Rendezvous;

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
        console.log('Connection established.');
    }

    onMessage(event: MessageEvent) {
        const message: StatusMessage = JSON.parse(event.data);
        //console.log('Received:', message);

        if (message.type === 'init') {
            this.rndv.createEditor();
        } else if (message.type === 'connections') {
            this.rndv.updateCoderCount(message.connections);
        } else if (message.type === 'state') {
            this.rndv.updateEditorState(message.state);
        } else if (message.type === 'failure') {
            console.error('Non-retriable WebSocket error', message.text);
            this.rndv.cancelUpdateWorker();
        }
    }

    onError(error: Event) {
        console.error('Retriable error:', error);
        this.rndv.clearSocket();
    }

    onClose() {
        console.log('Connection closed.');
        this.rndv.clearSocket();
    }

    isOpen(): boolean {
        return this.socket.readyState === this.socket.OPEN;
    }

    send(message: string) {
        this.socket.send(message);
    }
}