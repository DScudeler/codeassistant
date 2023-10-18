import * as vscode from "vscode";
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import { StringFormatter} from "../utilities/StringFormatter";

var grpc = require('@grpc/grpc-js');
var protoLoader = require('@grpc/proto-loader');

export class ChatViewProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'codeAssistant.chatView';

	private _view?: vscode.WebviewView;
	private _conversation: any;
	private _lastResponse: string;
	private _client;

	constructor(
		private readonly _extensionUri: vscode.Uri,
		target: string
	) {
		this._conversation = [];
		this._lastResponse = "";

		const PROTO_PATH = vscode.Uri.joinPath(_extensionUri, "out", "instruct.proto").fsPath;

		const packageDefinition = protoLoader.loadSync(
			PROTO_PATH,
			{
				keepCase: true,
				longs: String,
				enums: String,
				defaults: true,
				oneofs: true
			});

		const instProto = grpc.loadPackageDefinition(packageDefinition).instruct;
		this._client = new instProto.Instruction(target, grpc.credentials.createInsecure());
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
			}
		});
	}


	public clearChat() {
		// reset conversation
		this._conversation = [];

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


	private _sendToChat(prompt: string) {
		// retrieve selection
		const selected = vscode.window.activeTextEditor?.selection;
		const fullCode = vscode.window.activeTextEditor?.document;

		const configuration = vscode.workspace.getConfiguration();
		const systemPrompt = configuration.get<string>('codeAssistant.prompt.system');
		const userPrompt = configuration.get<string>('codeAssistant.prompt.user');
		const assistantPrompt = configuration.get<string>('codeAssistant.prompt.user');
		const selectionTemplate = configuration.get<string>('codeAssistant.prompt.selection');

		if (selected && !selected.isEmpty) {
			prompt += selectionTemplate;
		}

		this._conversation.push({
			role: "user",
			content: prompt,
			keys: {
				selection: fullCode?.getText(selected)
			}
		});
		
		const firstPromps = [{
			role: 'system',
			content: systemPrompt,
		},
		{
			role: 'user',
			content: userPrompt,
			keys: {
				sourceCode: fullCode?.getText()
			}
		},
			{
				role: 'assistant',
				content: assistantPrompt,
				keys:{}
			}
		];

		const conversationToSend = firstPromps.concat(this._conversation);

		let call = this._client.generate({ instruction: conversationToSend });
		let dataCallBack = (response: any) => {
			this._lastResponse = response.generation.content;
			this._view?.webview.postMessage({ type: 'chatUpdate', content: this._lastResponse });

		};

		let registerResponseCallBack = () => {
			this._conversation.pop();
			this._conversation.push({ role: 'assistant', content: this._lastResponse });
			call.end();
		};

		call.on('data', dataCallBack);
		call.on('end', registerResponseCallBack);
		
		// preparing the history
		this._conversation.push({ role: 'assistant', content: "" });
		
		// converting selections in the display
		const developpedConversiontion = this._conversation.map((row: any) => {
			let developpedContent = row.content;
			if (row.keys && row.keys.selection) {
				developpedContent = new StringFormatter(row.content, {selection: `\`\`\`${row.keys.selection}\`\`\``}).format();
			}
			return {role: row.role, content: developpedContent};
		});
		this._view?.webview.postMessage({ type: 'chatHistory', history: developpedConversiontion });
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
