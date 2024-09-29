import * as vscode from 'vscode';
import { createNote } from './create-note';
import { NotepadManager } from '../notepad-manager';

export function registerCommands(context: vscode.ExtensionContext, notepadManager: NotepadManager) {
	context.subscriptions.push(vscode.commands.registerCommand('notepad.newNote', () => {
		createNote(notepadManager);
	}));
}
