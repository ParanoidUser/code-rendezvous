import $ from 'jquery';
import 'bootstrap';
import './styles.css';
import { StatusMessage, State } from '../protocol.js';
import { EditorView, basicSetup } from "codemirror"
import { java } from "@codemirror/lang-java"

class WindowState {
    reported: string = '';
    socket?: SocketHolder;
    editor?: EditorView;
    timer?: any;

    initiateConnection() {
        if (!this.socket) {
            this.socket = new SocketHolder(this);
        }
    }

    updateCoderCount(count?: number) {
        if (!count) {
            count = 0;
        }
        $('#messageDiv').html("Coders: " + count);
    }

    createEditor() {
        if (!this.editor) {
            this.editor = new EditorView({
                extensions: [basicSetup, java()],
                parent: $('#editor')[0]
            });
            $('#loading').hide();
        }
    }

    updateEditorContent(editorState?: State) {
        if (this.editor && editorState) {
            const strState = JSON.stringify(editorState);
            if (this.reported !== strState) {
                this.editor.dispatch({
                    changes: { from: 0, to: this.editor.state.doc.length, insert: editorState.doc },
                    selection: {
                        anchor: editorState.selection.ranges[0].anchor,
                        head: editorState.selection.ranges[0].head
                    }
                });
                this.reported = strState;
            }
        }
    }

    getEditorContent(): string {
        if (this.editor) {
            return this.editor.state.doc.toString();
        }
        return "";
    }

    checkUpdate() {
        if (!this.socket || !this.socket.isOpen()) {
            this.initiateConnection();
        } else if (this.editor) {
            const strState = JSON.stringify(this.editor.state.toJSON());
            if (this.reported !== strState) {
                this.socket.send(strState);
                this.reported = strState;
            }
        }
    }

    clearSocket() {
        this.socket = undefined;
    }

    scheduleUpdateWorker() {
        this.timer = setInterval(this.checkUpdate.bind(this), 50);
    }

    cancelUpdateWorker() {
        if (this.timer) {
            console.log('Cancelling UpdateWorker');
            clearInterval(this.timer);
            this.timer = undefined;
        }
    }
}

class SocketHolder {

    private socket: WebSocket;
    private windowState: WindowState;

    constructor(windowState: WindowState) {
        this.windowState = windowState;
        console.log('Establishing WebSocket connection...');
        this.socket = new WebSocket(window.location.href.replace('http', 'ws'));
        this.socket.onopen = this.onOpen.bind(this);
        this.socket.onmessage = this.onMessage.bind(this);
        this.socket.onerror = this.onError.bind(this);
        this.socket.onclose = this.onClose.bind(this);
    }

    onOpen() {
        console.log('WebSocket connection established.');
    }

    onMessage(event: MessageEvent) {
        const message: StatusMessage = JSON.parse(event.data);
        console.log('Received:', message);

        if (message.type === 'init') {
            this.windowState.createEditor();
        } else if (message.type === 'connections') {
            this.windowState.updateCoderCount(message.connections);
        } else if (message.type === 'state') {
            this.windowState.updateEditorContent(message.state);
        } else if (message.type === 'failure') {
            console.error('Non-retriable WebSocket error', message.text);
            this.windowState.cancelUpdateWorker();
        }
    }

    onError(error: Event) {
        console.error('Retriable WebSocket error:', error);
        this.windowState.clearSocket();
    }

    onClose() {
        console.log('WebSocket connection closed.');
        this.windowState.clearSocket();
    }

    isOpen(): boolean {
        return this.socket.readyState === this.socket.OPEN;
    }

    send(message: string) {
        this.socket.send(message);
    }
}

const STATE = new WindowState();

$(function () {

    $('#copyContent').on('click', async function (event) {
        event.preventDefault();
        const editorContent = STATE.getEditorContent();
        await navigator.clipboard.writeText(editorContent);
        $(this).html('<i class="far fa-copy"></i> Copied!');
        setTimeout(() => {
            $(this).html('<i class="far fa-copy"></i> Copy content');
        }, 1000);
    });

    $('#copyLink').on('click', async function (event) {
        event.preventDefault();
        const url = window.location.href;
        await navigator.clipboard.writeText(url);
        $(this).html('<i class="far fa-copy"></i> Copied!');
        setTimeout(() => {
            $(this).html('<i class="far fa-copy"></i> Copy link');
        }, 1000);
    });

    STATE.scheduleUpdateWorker();
});
