import $ from 'jquery';
import './styles.css';
import { DOM } from './dom-elements';
import { Rendezvous } from './rendezvous';
import { Tooltip } from 'bootstrap';

const codersTooltip = new Tooltip(DOM.codersCounterTooltipHost[0]);
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

    static onResize() {
        var headerHeight = DOM.headerDiv.outerHeight(true);
        headerHeight = (headerHeight ? headerHeight : 0) + 5;
        DOM.editorDiv.css('height', `calc(100vh - ${headerHeight}px)`);
    }
}

$(function () {
    DOM.copyContentButton.on('click', EventHandlers.onCopyContentButtonClick);
    DOM.copyLinkButton.on('click', EventHandlers.onCopyLinkButtonClick);
    $(window).on('resize', EventHandlers.onResize);
    DOM.containerDiv.on('show', EventHandlers.onResize);

    RNDV.updateCoderCount(0);
    RNDV.scheduleUpdateWorker();
    EventHandlers.onResize();
});
