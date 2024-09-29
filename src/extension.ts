import * as vscode from 'vscode';
import { registerCommands } from './commands/register';
import { NotepadManager } from './notepad-manager';
import { NotepadTreeDataProvider } from './providers/notepad-provider';

const notepadManager = new NotepadManager();

export function activate(context: vscode.ExtensionContext) {
	const { registerTreeDataProvider } = vscode.window;

	registerTreeDataProvider('vscode-notepad', new NotepadTreeDataProvider(notepadManager));
	registerCommands(context, notepadManager);

	notepadManager.setup().catch(console.error);
}

export function deactivate() {
	notepadManager.destroy();
}
