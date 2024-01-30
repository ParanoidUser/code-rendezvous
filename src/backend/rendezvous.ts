import * as WebSocket from 'ws';
import { State, keepAliveState, SupportedLanguage } from '../protocol.js';
import { SocketWrapper } from './socket-wrapper.js';

export class Rendezvous {

    private static readonly ID_CHARACTER_SET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    private static readonly ID_LENGTH = 8;

    private static isKeepAliveState(state: State): boolean {
        return !state.doc && state.selection.main === keepAliveState.selection.main;
    }

    readonly id: string;
    private sockets: SocketWrapper[] = [];
    private state?: State;
    private lastUpdateTimestamp: number = Date.now();
    private language: SupportedLanguage;
    private initialized = false;

    constructor(language: SupportedLanguage) {
        let iid = '';
        for (let i = 0; i < Rendezvous.ID_LENGTH; i++) {
            iid += Rendezvous.ID_CHARACTER_SET.charAt(
                Math.floor(Math.random() * Rendezvous.ID_CHARACTER_SET.length));
        }
        this.id = iid;
        this.language = language;
    }

    addSocket(socket: WebSocket, remoteAddress: string) {
        const wrapper = new SocketWrapper(socket, this, remoteAddress);
        this.sockets.push(wrapper);
        wrapper.sender.sendInitMessage(this.language);
        if (this.state) {
            wrapper.sender.sendStateMessage(this.state);
        }
        this.notifyAllConnections();
        console.log("Connection to " + this.id + " from " + wrapper.remoteAddress + " (" + wrapper.id +") opened");
        this.initialized = true;
    }

    setState(source: SocketWrapper, state: string) {
        const parsedState: State = JSON.parse(state);
        if (Rendezvous.isKeepAliveState(parsedState)) {
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
        console.log("Connection to " + this.id + " from " + socket.remoteAddress + " (" + socket.id +") closed. " + this.sockets.length + " connections remaining");
    }

    notifyAllConnections() {
        this.sockets.forEach(socket => {
            socket.sender.sendConnectionsMessage(this.sockets.length);
        });
    }

    isExpired(): boolean {
        // 4 hours since last state update for initialized rendezvous and 5 mins for uninitialized
        const lifetime = Date.now() - this.lastUpdateTimestamp;
        return this.initialized ? lifetime > 1000 * 60 * 60 * 4 : lifetime > 1000 * 60 * 5;
    }

    isIdle(): boolean {
        return this.sockets.length == 0 || Date.now() - this.lastUpdateTimestamp > 1000 * 60 * 30;
    }

    close() {
        this.sockets.forEach(socket => {
            socket.sender.sendFailureMessage("Rendezvous adjourned");
            socket.close();
        });
    }
}
