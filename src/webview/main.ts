import { provideVSCodeDesignSystem, vsCodeButton, vsCodeTextArea } from "@vscode/webview-ui-toolkit";

provideVSCodeDesignSystem().register(vsCodeButton(), vsCodeTextArea());

const vscode = acquireVsCodeApi();
const md = require('markdown-it')();

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
            }
            content.innerHTML = md.render(content.textContent);

            insertCopyButton(content);
            
            conversationList.appendChild(content);
        }
    }
}

function insertCopyButton(chatElement: HTMLDivElement) {
    // Get all the code sections inside the provided element
    const codeSections = chatElement.querySelectorAll('code');

    // Iterate through each code section
    codeSections.forEach(code => {
        // Create a copy button
        const copyButton = document.createElement('button');
        copyButton.textContent = 'Copy';
        copyButton.classList.add('copy-button');

        // Create an overlay
        const overlay = document.createElement('div');
        overlay.classList.add('overlay');

        // Create a container div for the code section and the copy button
        const containerDiv = document.createElement('div');
        containerDiv.classList.add('code-container');

        // Append the code section, the copy button, and the overlay to the container
        const parent = code.parentNode;

        containerDiv.appendChild(code.cloneNode(true));        
        containerDiv.appendChild(overlay);
        containerDiv.appendChild(copyButton);

        // Append the container to the parent of the code section
        parent?.replaceChild(containerDiv, code);

        // Add event listener for mouseover to show the copy button and overlay
        containerDiv.addEventListener('mouseover', () => {
            copyButton.style.display = 'block';
            overlay.style.display = 'block';
        });

        // Add event listener for mouseout to hide the copy button and overlay
        containerDiv.addEventListener('mouseout', () => {
            copyButton.style.display = 'none';
            overlay.style.display = 'none';
        });

        // Add event listener for click to copy the code
        copyButton.addEventListener('click', () => {
            const textToCopy = code.textContent;
            navigator.clipboard.writeText(textToCopy ? textToCopy : "").then(() => {
                alert('Code copied successfully!');
            }).catch(err => {
                console.error('Failed to copy code: ', err);
            });
        });

        // dbl click sends to current editor
        copyButton.addEventListener('dblclick', () => {
            const textToCopy = code.textContent;
            vscode.postMessage({type: 'insertText', text: textToCopy});            
        });
    });
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
