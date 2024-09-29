import * as vscode from 'vscode';

const configuration = vscode.workspace.getConfiguration('notepad');

export function getNotepadFolderName(): string {
	return configuration.get('noteFolderName')!;
}

export function getNotepadFileExtension(): string {
	let ext = configuration.get<string>('noteFileExtension')!;

	if (!ext.startsWith('.'))
		ext = `.${ext}`;

	return ext;
}

export function getNotepadPrefixFormat(): string {
	return configuration.get('notePrefixFormat')!;
}
