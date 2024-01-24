import { EditorWrapper } from "./editor-wrapper";
import { SocketWrapper } from "./socket-wrapper";
import { State } from '../protocol';
import { DOM } from "./dom-elements";

export class Rendezvous {
    private remoteState: string = '';
    private socket?: SocketWrapper;
    private editor?: EditorWrapper;
    private timer?: any;

    initiateConnection() {
        if (!this.socket) {
            this.socket = new SocketWrapper(this);
        }
    }

    updateCoderCount(count?: number) {
        if (!count) {
            count = 0;
        }
        DOM.codersCounterDiv.html(""+count);
    }

    createEditor() {
        if (!this.editor) {
            this.editor = new EditorWrapper();
            DOM.editorLoadingDiv.hide();
        }
    }

    getEditorContent() {
        return this.editor?.getContent() || '';
    }

    updateEditorState(editorState?: State) {
        if (this.editor && editorState) {
            const strState = JSON.stringify(editorState);
            if (this.remoteState !== strState) {
                this.editor.setState(editorState);
                this.remoteState = strState;
            }
        }
    }

    checkUpdate() {
        if (!this.socket || !this.socket.isOpen()) {
            this.initiateConnection();
        } else if (this.editor) {
            const strState = this.editor.getStateAsJson();
            if (this.remoteState !== strState) {
                this.socket.send(strState);
                this.remoteState = strState;
            } else {
                this.socket.keepAlive();
            }
        }
    }

    clearSocket() {
        this.socket = undefined;
    }

    scheduleUpdateWorker() {
        this.timer = setInterval(this.checkUpdate.bind(this), 200);
    }

    cancelUpdateWorker() {
        if (this.timer) {
            console.log('Cancelling UpdateWorker');
            clearInterval(this.timer);
            this.timer = undefined;
        }
    }

    showConnectedStatus(connected: boolean, message?: string) {
        if (connected) {
            DOM.statusName.attr('title', 'Connected');
            DOM.statusIcon.addClass('fa-check-circle');
            DOM.statusIcon.removeClass('fa-exclamation-triangle');
        } else {
            DOM.statusName.attr('title', 'Disconnected' + (message ? ':' + message : ''));
            DOM.statusIcon.removeClass('fa-check-circle');
            DOM.statusIcon.addClass('fa-exclamation-triangle');            
        }
    }
}
