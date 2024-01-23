import $ from 'jquery';
import 'bootstrap';
import './styles.css';
import { DOM } from './dom-elements';
import { Rendezvous } from './rendezvous';

const RNDV = new Rendezvous();

$(function () {

    DOM.copyContentButton.on('click', async function (event) {
        event.preventDefault();
        const editorContent = RNDV.getEditorContent();
        await navigator.clipboard.writeText(editorContent);
        $(this).html('<i class="far fa-copy"></i> Copied!');
        setTimeout(() => {
            $(this).html('<i class="far fa-copy"></i> Copy content');
        }, 1000);
    });

    DOM.copyLinkButton.on('click', async function (event) {
        event.preventDefault();
        const url = window.location.href;
        await navigator.clipboard.writeText(url);
        $(this).html('<i class="far fa-copy"></i> Copied!');
        setTimeout(() => {
            $(this).html('<i class="far fa-copy"></i> Copy link');
        }, 1000);
    });

    RNDV.updateCoderCount(0);
    RNDV.scheduleUpdateWorker();
});
