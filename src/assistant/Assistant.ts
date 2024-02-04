import { Conversation } from "./Conversation";
import OpenAI from "openai";

/**
 * \brief class defining a link to the assistant and therefore
 * establishes communication to the llm for requests
 * unique interface, several chunks and only one if not streaming
 */
export class Assistant {
    
    private _communication : OpenAI;

    constructor(apiBase: string, apiKey: string) {
        this._communication = new OpenAI({apiKey: apiKey, baseURL: apiBase});
    }

    /* 
     * sends a request to the communication layout
     * returns an asynchronous promise for batch and stream.
     * no difference is made.
     */
    async request(conversation: Conversation) {
        const models = await this._communication.models.list();
        const model = models.data[0].id;
        const answer = this._communication.chat.completions.create({
            messages: conversation.unfold() as Array<OpenAI.ChatCompletionUserMessageParam>,
            model: model,
            stream: true
        });

        return answer;
    }
}
