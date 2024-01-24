import * as WebSocket from 'ws';
import { State, keepAliveState } from '../protocol.js';
import { SocketWrapper } from './socket-wrapper.js';

export class Rendezvous {

    private static readonly ID_CHARACTER_SET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    private static readonly ID_LENGTH = 6;

    private static isKeepAliveState(state: State): boolean {
        return !state.doc && state.selection.main === keepAliveState.selection.main;
    }

    readonly id: string;
    private sockets: SocketWrapper[] = [];
    private state?: State;
    private lastUpdateTimestamp: number = Date.now();

    constructor() {
        let iid = '';
        for (let i = 0; i < Rendezvous.ID_LENGTH; i++) {
            iid += Rendezvous.ID_CHARACTER_SET.charAt(
                Math.floor(Math.random() *  Rendezvous.ID_CHARACTER_SET.length));
        }
        this.id = iid;
    }

    addSocket(socket: WebSocket) {
        const wrapper = new SocketWrapper(socket, this);
        this.sockets.push(wrapper);
        wrapper.sender.sendInitMessage();
        if (this.state) {
            wrapper.sender.sendStateMessage(this.state);
        }
        this.notifyAllConnections();
    }

    setState(source: SocketWrapper, state: string) {
        const parsedState: State = JSON.parse(state);
        if(Rendezvous.isKeepAliveState(parsedState)) {
            source.sender.sendKeepAliveMessage();
            return;
        }
        this.lastUpdateTimestamp = Date.now();
        this.state = parsedState;
        this.sockets.forEach(socket => {
            if (socket !== source) {
                socket.sender.sendStateMessage(parsedState);
            }
        });
    }

    removeSocket(socket: SocketWrapper) {
        this.sockets = this.sockets.filter(s => s !== socket);
        this.notifyAllConnections();
    }

    notifyAllConnections() {
        this.sockets.forEach(socket => {
            socket.sender.sendConnectionsMessage(this.sockets.length);
        });
    }

    isExpired(): boolean {
        // 4 hours since last state update
        return Date.now() - this.lastUpdateTimestamp > 1000 * 60 * 60 * 4;
    }

    close() {
        this.sockets.forEach(socket => {
            socket.sender.sendFailureMessage("Rendezvous adjourned");
            socket.close();
        });
    }
}
