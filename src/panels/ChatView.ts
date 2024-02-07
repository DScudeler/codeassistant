import * as vscode from "vscode";
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import { Assistant } from "../assistant/Assistant";
import { Conversation } from "../assistant/Conversation";


export class ChatViewProvider implements vscode.WebviewViewProvider {

	
	public static readonly viewType = 'codeAssistant.chatView';


	private _view?: vscode.WebviewView;
	private _conversation = new Conversation();
	private _lastResponse = "";
	private _assistant: Assistant;


	constructor(
		private readonly _extensionUri: vscode.Uri,
		target: string,
		key: string
	) {
		this._assistant = new Assistant(target, key);
	}


	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [
				this._extensionUri
			]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		// message broker from webview
		webviewView.webview.onDidReceiveMessage(data => {
			switch (data.type) {
				case 'prompt':
					{
						this._sendToChat(data.value);
						break;
					}
				case 'insertText':
					{
						const editor = vscode.window.activeTextEditor;
						if (editor) {
							// Insérer du texte à la position du curseur actuel
							editor.edit(editBuilder => {
								if (editor) {
									editBuilder.insert(editor.selection.active, data.text);
								}
							});
						}
					}
			}
		});
	}


	public clearChat() {
		// reset conversation
		this._conversation.clear();

		// and send refresh order
		this._view?.webview.postMessage({ type: 'chatHistory', history: this._conversation });
	}


	public openChat() {
		// retrieves prompt and sends it for LLM
		const userInput = vscode.window.showInputBox();

		userInput.then((prompt?) => {
			if (prompt) {
				this._sendToChat(prompt);
			}
		});
	}


	private async _sendToChat(prompt: string) {
		// retrieve selection
		const selected = vscode.window.activeTextEditor?.selection;
		const fullCode = vscode.window.activeTextEditor?.document;

		const configuration = vscode.workspace.getConfiguration();
		const useSystem = configuration.get<boolean>('codeAssistant.prompt.useSystem');
		const systemPrompt = configuration.get<string>('codeAssistant.prompt.system');
		const userPrompt = configuration.get<string>('codeAssistant.prompt.user');
		const assistantPrompt = configuration.get<string>('codeAssistant.prompt.assistant');
		const selectionTemplate = configuration.get<string>('codeAssistant.prompt.selection');

		if (selected && !selected.isEmpty) {
			prompt += selectionTemplate;
		}

		this._conversation.add({
			role: "user",
			content: prompt,
			keys: {
				selection: fullCode?.getText(selected)
			}
		}
		);

		let conversationToSend = new Conversation();

		if (systemPrompt) {
			conversationToSend.add({
				role: useSystem ? 'system' : 'user',
				content: systemPrompt,
				keys: {}
			});
		}

		if (!useSystem && assistantPrompt) {
			conversationToSend.add({
				role: 'assistant',
				content: "",
				keys: {}
			});
		}

		if (userPrompt && assistantPrompt) {
			conversationToSend.add({
				role: 'user',
				content: userPrompt,
				keys: {
					sourceCode: fullCode?.getText()
				}
			});

			conversationToSend.add({
				role: 'assistant',
				content: "",
				keys: {}
			});
		}

		conversationToSend.append(this._conversation);

		const answer = await this._assistant.request(conversationToSend);

		// preparing the history
		this._conversation.add({ role: 'assistant', content: "", keys: {} });

		for await (const chunk of answer) {
			if (chunk.choices[0].delta.content) {
				this._lastResponse += chunk.choices[0].delta.content;
			}
			this._view?.webview.postMessage({ type: 'chatUpdate', content: this._lastResponse });
		}

		this._conversation.takeLast();
		this._conversation.add({ role: 'assistant', content: this._lastResponse, keys: {} });
		this._lastResponse = "";

		this._view?.webview.postMessage({ type: 'chatHistory', history: this._conversation.unfold() });
	}


	private _getHtmlForWebview(webview: vscode.Webview) {
		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		const scriptUri = getUri(webview, this._extensionUri, ['out', 'webview.js']);
		const styleMainUri = getUri(webview, this._extensionUri, ['out', 'main.css']);

		// Use a nonce to only allow a specific script to be run.
		const nonce = getNonce();

		return /*html*/`<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading styles from our extension directory,
					and only allow scripts that have a specific nonce.
					(See the 'webview-sample' extension sample for img-src content security policy examples)
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleMainUri}" rel="stylesheet">

				<title>Chat Code</title>
			</head>
			<body>
				<div class="conversation-list">
				</div>

				<script type="module" nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}
}
