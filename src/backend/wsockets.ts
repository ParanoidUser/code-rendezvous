import * as WebSocket from 'ws';
import { State } from '../protocol.js';
import { MessageSender } from './wssender.js';

class SocketWrapper {
    private socket: WebSocket;
    private channel: Channel;
    readonly sender: MessageSender;

    constructor(socket: WebSocket, channel: Channel) {
        this.socket = socket;
        this.channel = channel;
        this.sender = new MessageSender(socket);
        this.socket.on('message', this.processMessage.bind(this));
        this.socket.on('close', this.onClose.bind(this));
    }

    processMessage(message: WebSocket.RawData) {
        const messageString = message.toString();
        this.channel.setState(this, messageString);
    }

    onClose() {
        this.channel.removeSocket(this);
    }

    close() {
        this.socket.close();
    }
}

class Channel {
    private sockets: SocketWrapper[] = [];
    private state: State = {
        doc: "",
        selection: {
            ranges: [{
                anchor: 0,
                head: 0
            }],
            main: 0
        }
    };

    private lastUpdateTimestamp: number = 0;

    addSocket(socket: WebSocket) {
        this.lastUpdateTimestamp = Date.now();
        const wrapper = new SocketWrapper(socket, this);
        this.sockets.push(wrapper);
        wrapper.sender.sendInitMessage();
        wrapper.sender.sendConnectionsMessage(this.sockets.length);
        wrapper.sender.sendStateMessage(this.state);
    }

    setState(source: SocketWrapper, state: string) {
        this.lastUpdateTimestamp = Date.now();
        const parsedState = JSON.parse(state);
        this.state = parsedState;
        this.sockets.forEach(socket => {
            if (socket !== source) {
                socket.sender.sendStateMessage(parsedState);
            }
        });
    }

    removeSocket(socket: SocketWrapper) {
        this.lastUpdateTimestamp = Date.now();
        this.sockets = this.sockets.filter(s => s !== socket);
        this.sockets.forEach(socket => {
            socket.sender.sendConnectionsMessage(this.sockets.length);
        });
    }

    isExpired(): boolean {
        // 8 hours since last update
        return Date.now() - this.lastUpdateTimestamp > 1000 * 60 * 60 * 8;
    }

    closeChannel() {
        this.sockets.forEach(socket => {
            socket.sender.sendFailureMessage("Channel closed");
            socket.close();
        });
    }
}

export class ChannelManager {
    private channels: Record<string, Channel> = {};
    private server: WebSocket.Server;

    constructor(server: WebSocket.Server) {
        this.server = server;
        this.server.on('connection', this.onConnection.bind(this));
        setInterval(this.clearExpiredChannels.bind(this), 1000 * 60 * 60);
    }

    onConnection(ws: WebSocket, req: any) {
        const channelId = req.url.split('/')[1];
        const channel = this.channels[channelId];
        if (channel) {
            channel.addSocket(ws);
            console.log("Connected " + req.url);
        } else {
            new MessageSender(ws).sendFailureMessage("Channel not found");
            ws.close();
            console.log("Failed connection attempt to " + req.url);
        }
    }

    createChannel(): string {
        const id = this.generateId();
        this.channels[id] = new Channel();
        return id;
    }

    generateId(): string {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const length = 6;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    channelExists(id: string): boolean {
        return this.channels[id] !== undefined;
    }

    clearExpiredChannels() {
        Object.keys(this.channels).forEach(id => {
            const channel = this.channels[id];
            if (channel.isExpired()) {
                console.log("Channel " + id + " expired");
                channel.closeChannel();
                this.removeChannel(id);
            }
        });
    }

    removeChannel(id: string) {
        delete this.channels[id];
    }
}


