import { EditorWrapper } from "./editor-wrapper";
import { SocketWrapper } from "./socket-wrapper";
import { State, StatusMessage } from '../protocol';
import { DOM } from "./dom-elements";
import { Tooltip } from 'bootstrap';

export class Rendezvous {
    private remoteState: string = '';
    private socket?: SocketWrapper;
    private editor?: EditorWrapper;
    private timer?: any;
    private statusTooltip = new Tooltip(DOM.statusName[0]);
    private statusMessage: string = '';
    private languageTooltip = new Tooltip(DOM.languageName[0]);

    updateCoderCount(count?: number) {
        if (!count) {
            count = 0;
        }
        DOM.codersCounterDiv.html(""+count);
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

    dispatchStatusMessage(message: StatusMessage){
        if (message.type === 'init') {
            if (!this.editor) {
                this.editor = new EditorWrapper(message.text);
                DOM.editorLoadingDiv.hide();
                DOM.languageIcon.removeClass('fa fa-question');
                DOM.languageIcon.addClass(this.editor.languageIconClasses);
                this.languageTooltip.setContent({ '.tooltip-inner': 'Syntax: ' + this.editor.language });
            }
        } else if (message.type === 'connections') {
            this.updateCoderCount(message.connections);
        } else if (message.type === 'state') {
            this.updateEditorState(message.state);
        } else if (message.type === 'failure') {
            console.error('Non-retriable connection error', message.text);
            this.cancelUpdateWorker();
            this.socket?.close();
            this.showConnectionStatus(false, message.text);
        }
    }

    checkUpdate() {
        if (!this.socket) {
            this.socket = new SocketWrapper(this);
        } else if (!this.socket.isOpen()) {
            //still connecting
            return;
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

    showConnectionStatus(connected: boolean, message?: string) {
        message = connected ? 'Connected' : (message ? message : 'Disconnected');
        if(message !== this.statusMessage) {
            this.statusMessage = message;
            this.statusTooltip.setContent({ '.tooltip-inner': message });
        }
        if (connected && DOM.statusIconDisconnected.is(':visible')) {
            DOM.statusIconConnected.show();
            DOM.statusIconDisconnected.hide();
        } 
        if(!connected && DOM.statusIconConnected.is(':visible')) {
            DOM.statusIconConnected.hide();
            DOM.statusIconDisconnected.show();            
        }
    }
}
