// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import fetch from 'node-fetch';
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "SCTransformationExtension" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('SCTransformationExtension.generatescd', () => {
		// The code you place here will be executed every time your command is executed
		var str = vscode.window.activeTextEditor?.document.getText();
		var input = new Input(str ?? "", "Solidity");
		SendToAPI(input).then((str: string) => {
			fs.writeFile('/tmp/SmartContractDescriptor.json', str, function (err) {
				if (err) { return console.log(err); }
			});

			vscode.workspace.openTextDocument(vscode.Uri.parse("/tmp/SmartContractDescriptor.json")).then((a: vscode.TextDocument) => {
				var column =vscode.window.activeTextEditor?.viewColumn??0;
				vscode.window.showTextDocument(a, column+1, false);
			}, (error: any) => {
				console.error(error);
			});
		});
		// Display a message box to the user
		vscode.window.showInformationMessage('SCTransformationExtension is Ready!');
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }

async function SendToAPI(input: Input): Promise<string> {
	process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
	const response = await fetch("https://localhost:5003/api/GetSmartContractDescriptor", {
		timeout: 120 * 60 * 1000,
		method: 'POST',
		body: JSON.stringify(input),
		headers: { 'Content-Type': 'application/json; charset=UTF-8' }
	});

	if (!response.ok) { /* Handle */ }

	if (response.body !== null) {
		return JSON.stringify(await response.json());
	}
	return "";
}

class Input {
	content: string;
	type: string;
	constructor(content: string, type: string) {
		this.content = content;
		this.type = type;
	}
}