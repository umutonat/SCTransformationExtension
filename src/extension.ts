// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import fetch from 'node-fetch';
import { Console } from 'console';

const windowsLink = "https://github.com/umutonat/SmartContractDescriptorsGenerator/releases/download/v0.1/win-x64.zip";
const macLink = "https://github.com/umutonat/SmartContractDescriptorsGenerator/releases/download/v0.1/osx-x64.zip";
const linuxLink = "https://github.com/umutonat/SmartContractDescriptorsGenerator/releases/download/v0.1/linux-x64.zip";
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	if (process.platform === 'darwin') {
		console.info(process.platform);
	} else if (process.platform === 'win32') {
		console.info(process.platform);
	} else if (process.platform === 'linux') {
		console.info(process.platform);
	} else {
		vscode.window.showWarningMessage('Your OS currently not supported!');
		console.info(process.platform);
		return;
	}

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposableSolidity = vscode.commands.registerCommand('SCTransformationExtension.solidityscd', soliditySCDCommand);
	let disposableJavaScript = vscode.commands.registerCommand('SCTransformationExtension.javascriptscd', javaScriptSCDCommand);
	let disposableGo = vscode.commands.registerCommand('SCTransformationExtension.goscd', goSCDCommand);
	let disposableScipApp = vscode.commands.registerCommand('SCTransformationExtension.scipapp', SCIPAppCommand);
	context.subscriptions.push(disposableSolidity);
	context.subscriptions.push(disposableJavaScript);
	context.subscriptions.push(disposableGo);
	context.subscriptions.push(disposableScipApp);
	console.log('SCTransformation is ready!');
}

function soliditySCDCommand() {
	var str = vscode.window.activeTextEditor?.document.getText();
	var input = new SCDInput(str ?? "", "Solidity");
	var timestamp = Date.now().toString();
	RequestSCD(input).then((str: string) => {
		fs.writeFile('/tmp/' + timestamp + '.json', JSON.stringify(new SCIPInput(str, "", "")), function (err) {
			if (err) { return console.log(err); }
		});

		vscode.workspace.openTextDocument(vscode.Uri.parse('/tmp/' + timestamp + '.json')).then((a: vscode.TextDocument) => {
			var column = vscode.window.activeTextEditor?.viewColumn ?? 0;
			vscode.window.showTextDocument(a, column + 1, false);
		}, (error: any) => {
			console.error(error);
		});
	});
	vscode.window.showInformationMessage('Successfully generated scd!');
}
function javaScriptSCDCommand() {
	var str = vscode.window.activeTextEditor?.document.getText();
	var input = new SCDInput(str ?? "", "JavaScript");
	var timestamp = Date.now().toString();
	RequestSCD(input).then((str: string) => {
		fs.writeFile('/tmp/' + timestamp + '.json', JSON.stringify(new SCIPInput(str, "", "")), function (err) {
			if (err) { return console.log(err); }
		});

		vscode.workspace.openTextDocument(vscode.Uri.parse('/tmp/' + timestamp + '.json')).then((a: vscode.TextDocument) => {
			var column = vscode.window.activeTextEditor?.viewColumn ?? 0;
			vscode.window.showTextDocument(a, column + 1, false);
		}, (error: any) => {
			console.error(error);
		});
	});
	vscode.window.showInformationMessage('Successfully generated scd!');
}
function goSCDCommand() {
	var str = vscode.window.activeTextEditor?.document.getText();
	var input = new SCDInput(str ?? "", "Go");
	var timestamp = Date.now().toString();
	RequestSCD(input).then((str: string) => {
		fs.writeFile('/tmp/' + timestamp + '.json', JSON.stringify(new SCIPInput(str, "", "")), function (err) {
			if (err) { return console.log(err); }
		});

		vscode.workspace.openTextDocument(vscode.Uri.parse('/tmp/' + timestamp + '.json')).then((a: vscode.TextDocument) => {
			var column = vscode.window.activeTextEditor?.viewColumn ?? 0;
			vscode.window.showTextDocument(a, column + 1, false);
		}, (error: any) => {
			console.error(error);
		});
	});
	vscode.window.showInformationMessage('Successfully generated scd!');
}

function SCIPAppCommand() {
	var str = vscode.window.activeTextEditor?.document.getText();
	var input: SCIPInput = JSON.parse(str ?? "");
	var timestamp = Date.now().toString();
	RequestSCIP(input).then((str: string) => {
		fs.writeFile('/tmp/' + timestamp + '.txt', str, function (err) {
			if (err) { return console.log(err); }
		});

		vscode.workspace.openTextDocument(vscode.Uri.parse('/tmp/' + timestamp + '.txt')).then((a: vscode.TextDocument) => {
			var column = vscode.window.activeTextEditor?.viewColumn ?? 0;
			vscode.window.showTextDocument(a, column + 1, false);
		}, (error: any) => {
			console.error(error);
		});
	});
	vscode.window.showInformationMessage('Successfully generated client app!');
}
// this method is called when your extension is deactivated
export function deactivate() {
	console.warn('deactivated');
 }

async function RequestSCD(input: SCDInput): Promise<string> {
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

async function RequestSCIP(input: SCIPInput): Promise<string> {
	process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
	const response = await fetch("https://localhost:5003/api/GetSmartContractInvocationProtocol", {
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

class SCDInput {
	content: string;
	type: string;
	constructor(content: string, type: string) {
		this.content = content;
		this.type = type;
	}
}

class SCIPInput {
	content: string;
	packageName: string;
	callbackUrl: string;
	constructor(content: string, type: string, callbackUrl: string) {
		this.content = content;
		this.packageName = type;
		this.callbackUrl = callbackUrl;
	}
}