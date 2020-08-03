import * as vscode from 'vscode';
import * as fs from 'fs';
import fetch from 'node-fetch';
import * as os from 'os';
import extract = require('extract-zip');
import util = require('util');
import child_process = require('child_process');
import path = require('path');
const execFile = util.promisify(require('child_process').execFile);
const streamPipeline = util.promisify(require('stream').pipeline);

const windowsLink = 'https://github.com/umutonat/SmartContractDescriptorsGenerator/releases/download/v1.2/win-x64.zip';
const macLink = 'https://github.com/umutonat/SmartContractDescriptorsGenerator/releases/download/v1.2/osx-x64.zip';
const linuxLink = 'https://github.com/umutonat/SmartContractDescriptorsGenerator/releases/download/v1.2/linux-x64.zip';
var backendPath: string;
var backendProcess: child_process.ChildProcess;

export async function activate(context: vscode.ExtensionContext) {

	if (process.platform === 'darwin') {
		//TODO: Chmod for linux and os
		backendPath = os.homedir + path.sep + '.scbackend' + path.sep + 'SCTransformation.API';
		await DownloadRunBackend(macLink);
	} else if (process.platform === 'win32') {
		backendPath = os.homedir + path.sep + '.scbackend' + path.sep + 'SCTransformation.API.exe';
		await DownloadRunBackend(windowsLink);
	} else if (process.platform === 'linux') {
		backendPath = os.homedir + path.sep + '.scbackend' + path.sep + 'SCTransformation.API';
		await DownloadRunBackend(linuxLink);
	} else {
		vscode.window.showWarningMessage('Your OS currently not supported!');
		return;
	}

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposableScd = vscode.commands.registerCommand('SCTransformationExtension.scd', SCDCommand);
	let disposableScipApp = vscode.commands.registerCommand('SCTransformationExtension.scipapp', SCIPAppCommand);
	context.subscriptions.push(disposableScd);
	context.subscriptions.push(disposableScipApp);
	console.log('SCTransformation is ready!');
}

// this method is called when your extension is deactivated
export async function deactivate() {
	backendProcess.kill();
}

async function SCDCommand() {
	var str = vscode.window.activeTextEditor?.document.getText();
	let options: vscode.InputBoxOptions = {
		prompt: "Type of Document: ",
		placeHolder: "Solidity, Go or JavaScript (case sensitive)"
	};

	var type = await vscode.window.showInputBox(options);
	var input = new SCDInput(str ?? "", type ?? "");
	var timestamp = Date.now().toString();
	await RequestSCD(input).then((str: string) => {
		fs.writeFile(path.sep + 'tmp' + path.sep + timestamp + '.json', str, function (err) {
			if (err) { return console.log(err); }
		});
		vscode.workspace.openTextDocument(vscode.Uri.parse(path.sep + 'tmp' + path.sep + timestamp + '.json')).then((a: vscode.TextDocument) => {
			var column = vscode.window.activeTextEditor?.viewColumn ?? 0;
			vscode.window.showTextDocument(a, column + 1, false);
		}, (error: any) => {
			console.error(error);
		});
	});
	vscode.window.showInformationMessage('Successfully generated scd!');
}

async function SCIPAppCommand() {
	var str = vscode.window.activeTextEditor?.document.getText();
	let packageOptions: vscode.InputBoxOptions = {
		prompt: "Package name for client app: "
	};
	var packageName = await vscode.window.showInputBox(packageOptions);
	let callbackOptions: vscode.InputBoxOptions = {
		prompt: "Callback URL of client app: "
	};
	var callbackUrl = await vscode.window.showInputBox(callbackOptions);
	var input: SCIPInput = new SCIPInput(str ?? "", packageName ?? "", callbackUrl ?? "");
	var timestamp = Date.now().toString();
	await RequestSCIP(input).then((str: string) => {
		fs.writeFile(path.sep + 'tmp' + path.sep + timestamp + '.txt', "Client application path: " + str, function (err) {
			if (err) { return console.log(err); }
		});
		vscode.workspace.openTextDocument(vscode.Uri.parse(path.sep + 'tmp' + path.sep + timestamp + '.txt')).then((a: vscode.TextDocument) => {
			var column = vscode.window.activeTextEditor?.viewColumn ?? 0;
			vscode.window.showTextDocument(a, column + 1, false);
		}, (error: any) => {
			console.error(error);
		});
	});
	vscode.window.showInformationMessage('Successfully generated client app!');
}

async function RequestSCD(input: SCDInput): Promise<string> {
	const response = await fetch("http://localhost:5055/api/GetSmartContractDescriptor", {
		timeout: 120 * 60 * 1000,
		method: 'POST',
		body: JSON.stringify(input),
		headers: { 'Content-Type': 'application/json; charset=UTF-8' }
	});

	if (!response.ok) { }

	if (response.body !== null) {
		return JSON.stringify(await response.json());
	}
	return "";
}

async function RequestSCIP(input: SCIPInput): Promise<string> {
	const response = await fetch("http://localhost:5055/api/GetSmartContractInvocationProtocol", {
		timeout: 120 * 60 * 1000,
		method: 'POST',
		body: JSON.stringify(input),
		headers: { 'Content-Type': 'application/json; charset=UTF-8' }
	});
	if (!response.ok) { }
	if (response.body !== null) {
		return await response.text();
	}
	return "";
}

async function DownloadRunBackend(downloadPath: string) {
	try {
		if (!fs.existsSync(backendPath)) {
			var directory = os.homedir + path.sep + '.scbackend' + path.sep;
			const response = await fetch(downloadPath);
			if (!response.ok) {
				console.log(`unexpected response ${response.statusText}`);
				return;
			}
			await streamPipeline(response.body, fs.createWriteStream(path.sep + 'tmp' + path.sep + 'scbackend.zip'));
			await extract(path.sep + 'tmp' + path.sep + 'scbackend.zip', { dir: directory });
		}
		backendProcess = execFile(backendPath);
		await new Promise(resolve => setTimeout(resolve, 5000));
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
	constructor(content: string, packageName: string, callbackUrl: string) {
		this.content = content;
		this.packageName = packageName;
		this.callbackUrl = callbackUrl;
	}
}