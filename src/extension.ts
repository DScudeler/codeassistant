// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ChatViewProvider } from './panels/ChatView';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    const configuration = vscode.workspace.getConfiguration();
	const target = configuration.get<string>('codeAssistant.server.address');

    // no server configuration, no extension.
    if (!target) {
        return;
    }

	const provider = new ChatViewProvider(context.extensionUri, target);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(ChatViewProvider.viewType, provider));

    context.subscriptions.push(
        vscode.commands.registerCommand("codeAssistant.clearChat", () => {
            provider.clearChat();
        }),
        vscode.commands.registerCommand("codeAssistant.openChat", () => {
            provider.openChat();
        })
    );
}

// This method is called when your extension is deactivated
export function deactivate() {}
