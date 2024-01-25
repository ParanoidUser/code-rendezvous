import * as WebSocket from 'ws';
import { StatusMessage, State, SupportedLanguage } from '../protocol.js';

export class MessageSender {

    private socket: WebSocket;

    constructor(socket: WebSocket) {
        this.socket = socket;
    }

    private send(message: StatusMessage) {
        const messageString = JSON.stringify(message);
        //console.log('Sending message: ' + messageString);
        this.socket.send(messageString);
    }

    sendInitMessage(language: SupportedLanguage) {
        const message: StatusMessage = {
            type: 'init',
            text: language
        };
        this.send(message);
    }

    sendConnectionsMessage(connections: number) {
        const message: StatusMessage = {
            type: 'connections',
            connections: connections
        };
        this.send(message);
    }

    sendStateMessage(state: State) {
        const message: StatusMessage = {
            type: 'state',
            state: state
        };
        this.send(message);
    }

    sendFailureMessage(text: string) {
        const message: StatusMessage = {
            type: 'failure',
            text: text
        };
        this.send(message);
    }

    sendKeepAliveMessage() {
        const message: StatusMessage = {
            type: 'keep-alive'
        };
        this.send(message);
    }
}