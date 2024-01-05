import { StringFormatter } from "../utilities/StringFormatter";

export class Conversation {
    private _chat : {role: string, content: string, keys: any}[];

    constructor(){
        this._chat = [];
    }

    add(entry: {role: string, content: string, keys: any}) : void {
        this._chat.push({role: entry.role, content: entry.content, keys: entry.keys});
    }

    takeLast() : {role: string, content: string, keys: any} | undefined {
        return this._chat.pop();
    }

    getAll(): {role: string, content: string, keys: any}[] {
        return this._chat;
    }

    unfold(): {role: string, content: string}[] {
        /* formats given the different keys, transforming from content keys to content only */
        const isEmpty = (value: any) => {return !value || Object.keys(value).length === 0;};

        const format = (value: {role: string, content: string, keys: any}) : {role: string, content: string} => {
            if (!isEmpty(value.keys)) {
                const args = value.keys;
                const formatter = new StringFormatter(value.content, value.keys);
                return {role : value.role, content : formatter.format()};
            } else {
                return {role : value.role, content : value.content};
            }
        };

        return this._chat.map(format);
    }

    clear() {
        this._chat = [];
    }

    append(other: Conversation) {
        this._chat = this._chat.concat(other._chat);
    }
}
