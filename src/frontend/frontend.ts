import $ from 'jquery';
import 'bootstrap';
import './styles.css';
import { EditorView, basicSetup } from "codemirror"
import { java } from "@codemirror/lang-java"

const STATE = {
    reported: ""
};

$(function () {
    const socket = new WebSocket(window.location.href.replace('http', 'ws'));
    const editor = new EditorView({
        extensions: [basicSetup, java()],
        parent: $('#editor')[0]
    });

    socket.onopen = function () {
        console.log('WebSocket connection established.');
    };

    socket.onmessage = function (event) {
        var message = JSON.parse(event.data);
        console.log('Message received:', message);
        $('#messageDiv').html("Coders: " + message.connections);

        const strState = JSON.stringify(message.state);

        if (STATE.reported !== strState) {
            editor.dispatch({
                changes: { from: 0, to: editor.state.doc.length, insert: message.state.doc },
                selection: {
                    anchor: message.state.selection.ranges[0].anchor,
                    head: message.state.selection.ranges[0].head
                }
            });
            STATE.reported = strState;
        }
    };

    // When an error occurs
    socket.onerror = function (error) {
        console.error('WebSocket error:', error);
    };

    // When the connection is closed
    socket.onclose = function () {
        console.log('WebSocket connection closed.');
    };

    $('#copyContent').on('click', async function (event) {
        event.preventDefault();
        const editorContent = editor.state.doc.toString();
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

    setInterval(() => {
        const strState = JSON.stringify(editor.state.toJSON());
        if (STATE.reported !== strState && socket.readyState === socket.OPEN) {
            console.log('Sending state:', strState);
            socket.send(strState);
            STATE.reported = strState;
        }
    }, 50);

});
