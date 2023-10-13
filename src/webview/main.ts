import { provideVSCodeDesignSystem, vsCodeButton, vsCodeTextArea } from "@vscode/webview-ui-toolkit";

provideVSCodeDesignSystem().register(vsCodeButton(), vsCodeTextArea());

const vscode = acquireVsCodeApi();
const md = require('markdown-it')();

// chat responses and prompts
const button = document.querySelector('#chat-button');
if (button) {
    button.addEventListener('click', () => {
        sendChat();
    });
}

// Handle messages sent from the extension to the webview
window.addEventListener('message', event => {
    const message = event.data; // The json data that the extension sent        
    switch (message.type) {
        case 'chatHistory':
            {
                const values = message.history;
                updateChatHistory(values);
                break;
            }
        case 'chatUpdate':
            {
                const newText = message.content;
                updateChatResponse(newText);
                break;
            }
    }
});

// gets the prompt and sends it to the extension side
function sendChat() {
    const promptArea = document.querySelector('.prompt-area') as HTMLTextAreaElement;
    if (promptArea) {
        const text = promptArea.value;
        vscode.postMessage({ type: 'prompt', value: text });

        // reset prompt
        promptArea.value = "";
    }
}

/** updates chat view (from 0?)
 * type is either user or assistant
 * @param {Array<{role: string, content: string}>} chatHistory 
 */
function updateChatHistory(chatHistory: Array<{ role: string, content: string }>) {
    const conversationList = document.querySelector('.conversation-list');
    if (conversationList) {
        conversationList.textContent = '';
        for (const text of chatHistory) {
            const content = document.createElement('div');
            content.textContent = text.content;

            if (text.role === 'user') {
                content.className = "user-text";
            } else {
                content.className = "assistant-text";
                content.innerHTML = md.render(content.textContent);
            }

            conversationList.appendChild(content);
        }
    }
}

// sets chat result
function updateChatResponse(text: string) {
    const div = document.querySelector('.conversation-list');
    if (div) {
        const lastResponse = div.lastChild as HTMLDivElement;

        if (lastResponse) {
            lastResponse.innerHTML = md.render(text);
        }
    }
}
