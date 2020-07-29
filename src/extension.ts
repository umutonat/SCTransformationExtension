import * as vscode from 'vscode';
import * as fs from 'fs';
import fetch from 'node-fetch';
import * as os from 'os';
import extract = require('extract-zip');
import util = require('util');
import child_process = require('child_process');
const execFile = util.promisify(require('child_process').execFile);
const streamPipeline = util.promisify(require('stream').pipeline);

const windowsLink = 'https://github.com/umutonat/SmartContractDescriptorsGenerator/releases/download/v1.1/win-x64.zip';
const macLink = 'https://github.com/umutonat/SmartContractDescriptorsGenerator/releases/download/v1.1/osx-x64.zip';
const linuxLink = 'https://github.com/umutonat/SmartContractDescriptorsGenerator/releases/download/v1.1/linux-x64.zip';
var backendPath: string;
var backendProcess: child_process.ChildProcess[] = [];

export async function activate(context: vscode.ExtensionContext) {

	if (process.platform === 'darwin') {
		//TODO: Chmod for linux and os
		backendPath = os.homedir + '/.scbackend/SCTransformation.API';
		await DownloadRunBackend(macLink);
	} else if (process.platform === 'win32') {
		backendPath = os.homedir + '/.scbackend/SCTransformation.API.exe';
		await DownloadRunBackend(windowsLink);
	} else if (process.platform === 'linux') {
		backendPath = os.homedir + '/.scbackend/SCTransformation.API';
		await DownloadRunBackend(linuxLink);
	} else {
		vscode.window.showWarningMessage('Your OS currently not supported!');
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

// this method is called when your extension is deactivated
export async function deactivate() {
	console.warn('deactivated');
	backendProcess.forEach(process => {
		process.kill();
	});
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

async function RequestSCD(input: SCDInput): Promise<string> {
	process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
	const response = await fetch("https://localhost:5001/api/GetSmartContractDescriptor", {
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
	const response = await fetch("https://localhost:5001/api/GetSmartContractInvocationProtocol", {
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

async function DownloadRunBackend(downloadPath: string) {
	try {
		if (!fs.existsSync(backendPath)) {
			var directory = os.homedir + '/.scBackend/';
			const response = await fetch(downloadPath);
			if (!response.ok) {
				console.log(`unexpected response ${response.statusText}`);
				return;
			}
			await streamPipeline(response.body, fs.createWriteStream('/tmp/scbackend.zip'));
			await extract('/tmp/scbackend.zip', { dir: directory });
		}
		var child: child_process.ChildProcess = execFile(backendPath);
		backendProcess.push(child);
		await new Promise(resolve => setTimeout(resolve, 1000));
	}
	catch (error) {
		console.error(error);
	}
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