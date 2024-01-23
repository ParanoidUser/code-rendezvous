import { State } from '../protocol';
import { DOM } from './dom-elements';
import { basicSetup } from "codemirror"
import { EditorView, keymap } from "@codemirror/view"
import { indentWithTab } from "@codemirror/commands"
import { java } from "@codemirror/lang-java"

export class EditorWrapper {

    private editor: EditorView;

    constructor() {
        this.editor = new EditorView({
            extensions: [
                basicSetup,
                keymap.of([indentWithTab]),
                java()
            ],
            parent: DOM.editorDiv[0]
        });
    }

    setState(editorState: State) {
        this.editor.dispatch({
            changes: { from: 0, to: this.editor.state.doc.length, insert: editorState.doc },
            selection: {
                anchor: editorState.selection.ranges[0].anchor,
                head: editorState.selection.ranges[0].head
            }
        });
    }

    getContent(): string {
        return this.editor.state.doc.toString();
    }

    getStateAsJson(): string {
        return JSON.stringify(this.editor.state.toJSON());
    }
}
