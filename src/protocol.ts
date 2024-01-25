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

export interface StatusMessage {
    type: MessageType;
    text?: string;
    state?: State;
    connections?: number;
}

export const keepAliveState: State = {'doc': '', 'selection': {'ranges': [], 'main': -1}};

export type MessageType = 'init' | 'connections' | 'state' | 'failure' | 'keep-alive';

export type SupportedLanguage = 'CSS' | 'HTML' | 'Java' | 'JavaScript' | 'Plain Text';