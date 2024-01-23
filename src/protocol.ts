export interface Range {
    anchor: number;
    head: number;
}

export interface State {
    doc: string;
    selection: {
        ranges: Range[];
        main: number;
    };
}
export type MessageType = 'init' | 'connections' | 'state' | 'failure';

export interface StatusMessage {
    type: MessageType;
    text?: string;
    state?: State;
    connections?: number;
}
