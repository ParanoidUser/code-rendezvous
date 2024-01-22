import * as WebSocket from 'ws';

interface State {
    doc: string;
    selection: {
        anchor: number;
        head: number;
    };
}

interface StatusMessage {
    state: State;
    connections: number;
}

class SocketWrapper {
    private socket: WebSocket;
    private channel: Channel;

    constructor(socket: WebSocket, channel: Channel) {
        this.socket = socket;
        this.channel = channel;
        this.socket.on('message', this.processMessage.bind(this));
        this.socket.on('close', this.onClose.bind(this));
    }

    processMessage(message: WebSocket.RawData) {
        const messageString = message.toString();
        console.log('received: %s', messageString);
        this.channel.setState(this, messageString);
    }

    onClose() {
        this.channel.removeSocket(this);
    }

    send(message: StatusMessage) {
        this.socket.send(JSON.stringify(message));
    }
}

class Channel {
    private sockets: SocketWrapper[] = [];
    private state: State = {
        doc: "",
        selection: {
            anchor: 0,
            head: 0
        }
    };

    addSocket(socket: WebSocket) {
        const wrapper = new SocketWrapper(socket, this);
        this.sockets.push(wrapper);
        wrapper.send({ state: this.state, connections: this.sockets.length });
    }

    setState(source: SocketWrapper, state: string) {
        const parsedState = JSON.parse(state);
        this.state = parsedState;
        this.sockets.forEach(socket => {
            if (socket !== source) {
                socket.send({ state: parsedState, connections: this.sockets.length });
            }
        });
    }

    removeSocket(socket: SocketWrapper) {
        this.sockets = this.sockets.filter(s => s !== socket);
    }
}

export class ChannelManager {
    private channels: Record<string, Channel> = {};
    private server: WebSocket.Server;

    constructor(server: WebSocket.Server) {
        this.server = server;
        this.server.on('connection', this.onConnection.bind(this));
    }

    onConnection(ws: WebSocket, req: any) {
        console.log("Connected " + req.url);
        const channelId = req.url.split('/')[1];
        const channel = this.channels[channelId];
        if (channel) {
            channel.addSocket(ws);
        } else {
            ws.close();
        }

        // ws.on('message', (message: WebSocket.RawData) => {
        //     const messageString = message.toString();
        //     console.log('received: %s', messageString);
        // });

        // ws.send('something');
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

    ///////////////////////////////////////////////////////////////////////

    removeChannel(id: string) {
        delete this.channels[id];
    }
}


