import { State, SupportedLanguage } from '../protocol';
import { DOM } from './dom-elements';
import { basicSetup } from 'codemirror';
import { EditorView, keymap } from '@codemirror/view';
import { indentWithTab } from '@codemirror/commands';
import { java } from '@codemirror/lang-java';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { javascript } from '@codemirror/lang-javascript';

export class EditorWrapper {

    private editor: EditorView;
    readonly language: SupportedLanguage = 'Plain Text';
    readonly languageIconClasses: string = 'fas fa-font fs-4';

    constructor(language?: SupportedLanguage | string) {
        const extensions = [basicSetup, keymap.of([indentWithTab])];
        switch (language) {
            case 'CSS':
                this.language = language;
                this.languageIconClasses = 'fab fa-css3-alt fs-4';
                extensions.push(css());
                break;
            case 'HTML':
                this.language = language;
                this.languageIconClasses = 'fas fa-code fs-4';
                extensions.push(html());
                break;
            case 'Java':
                this.language = language;
                this.languageIconClasses = 'fab fa-java fs-4';
                extensions.push(java());
                break;
            case 'JavaScript':
                this.language = language;
                this.languageIconClasses = 'fab fa-js fs-4';
                extensions.push(javascript());
                break;
        }
        this.editor = new EditorView({
            extensions: extensions,
            parent: DOM.editorDiv[0]
        });
    }

    setState(editorState: State) {
        this.editor.dispatch({
            changes: { from: 0, to: this.editor.state.doc.length, insert: editorState.doc },
            selection: {
                anchor: editorState.selection.ranges[0].anchor,
                head: editorState.selection.ranges[0].head
            },
            scrollIntoView: true
        });
    }

    getContent(): string {
        return this.editor.state.doc.toString();
    }

    getStateAsJson(): string {
        return JSON.stringify(this.editor.state.toJSON());
    }
}
