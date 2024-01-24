import $ from 'jquery';
import 'bootstrap';
import './styles.css';
import { DOM } from './dom-elements';
import { Rendezvous } from './rendezvous';

const RNDV = new Rendezvous();

class EventHandlers {
    
    static flashCopyLabel() {
        DOM.copyDropDown.html('Copied!');
        setTimeout(() => {
            DOM.copyDropDown.html('Copy');
        }, 1000);
    }
    
    static onCopyContentButtonClick(event: JQuery.Event) {
        event.preventDefault();
        const editorContent = RNDV.getEditorContent();
        navigator.clipboard.writeText(editorContent);
        EventHandlers.flashCopyLabel();
    }

    static onCopyLinkButtonClick(event: JQuery.Event) {
        event.preventDefault();
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        EventHandlers.flashCopyLabel();
    }
}

$(function () {
    DOM.copyContentButton.on('click', EventHandlers.onCopyContentButtonClick);
    DOM.copyLinkButton.on('click', EventHandlers.onCopyLinkButtonClick);

    RNDV.updateCoderCount(0);
    RNDV.scheduleUpdateWorker();
});
