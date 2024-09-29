import { getNotepadFileExtension, getNotepadFolderName, getNotepadPrefixFormat } from '../lib/configuration';
import * as vscode from 'vscode';
import path from 'node:path';
import fsp from 'node:fs/promises';
import fs from 'node:fs';
import { NotepadManager } from '../notepad-manager';
import { format } from 'date-fns';

let lastWorkspace: string | undefined;

export async function createNote(noteManager: NotepadManager) {
	const name = await vscode.window.showInputBox({
		prompt: 'Give your note a title, or press enter to skip',
		placeHolder: 'My super important note'
	});

	const workspaces = noteManager.workspaceFolderPaths().reduce<Record<string, string>>((acc, val) => {
		acc[path.basename(val)] = val;

		return acc;
	}, {});

	const selectedWorkspace = await selectWorkspace(workspaces);

	if (!selectedWorkspace) return;

	const fileExtension = getNotepadFileExtension();
	const filenamePrefixFormat = getNotepadPrefixFormat();
	const prefixDate = format(new Date(), filenamePrefixFormat);
	const filename = `${prefixDate} ${name}${fileExtension}`;
	const filepath = path.join(workspaces[selectedWorkspace], getNotepadFolderName(), filename);

	if (!fs.existsSync(filepath))
		await fsp.writeFile(filepath, '', { encoding: 'utf-8' });

	vscode.window.showTextDocument(vscode.Uri.file(filepath), {
		preview: true,
	});
}

function getPlaceholder(workspaceNames: string[]) {
	if (!lastWorkspace) return workspaceNames[0];
	if (!workspaceNames.includes(lastWorkspace)) return workspaceNames[0];

	return lastWorkspace;
}

async function selectWorkspace(workspaces: Record<string, string>) {
	if (Object.keys(workspaces).length <= 1) return Object.keys(workspaces)[0];

	return await vscode.window.showQuickPick(Object.keys(workspaces), {
		placeHolder: getPlaceholder(Object.keys(workspaces)),
		title: 'Which notepad do you want to use?',
	});
}
