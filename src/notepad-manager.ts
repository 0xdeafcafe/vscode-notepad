import { getNotepadFileExtension, getNotepadFolderName } from './lib/configuration';
import * as vscode from 'vscode';
import fs from 'node:fs';
import * as path from 'node:path';

interface NotepadsStore {
	[workspaceFolderPath: string]: {
		[noteFilePath: string]: string | undefined;
	};
}

interface WorkspaceWatchers {
	[workspaceFolderPath: string]: fs.FSWatcher | undefined;
}

interface NoteChangedEvent {
	workspaceFolderPath: string;
	noteFilePath: string;
}

export class NotepadManager {
	private notepadWatchers: fs.FSWatcher[] = [];
	private workspaceWatchers: WorkspaceWatchers = {};
	private notepads: NotepadsStore = {};
	private noteChangedEmitter = new vscode.EventEmitter<NoteChangedEvent>();

	constructor() {
		vscode.workspace.onDidChangeWorkspaceFolders(() => {
			this.setup().catch(console.error);
		});
	}

	async setup() {
		this.destroy();

		const notepadFolderName = getNotepadFolderName();
		const workspaceFolderPaths: string[] = (vscode.workspace.workspaceFolders ?? []).map(folder => folder.uri.fsPath);

		for (const workspaceFolderPath of workspaceFolderPaths) {
			const workspaceNotepadFolderPath = path.join(workspaceFolderPath, notepadFolderName);

			// If the notepad folder doesnt exist, setup a watcher on the workspace until
			// it is created.
			if (!await checkFileExists(workspaceNotepadFolderPath)) {
				const watcher = fs.watch(
					workspaceFolderPath,
					{ encoding: 'utf8' },
					(event, filename) => this.workspaceWatcher(event, workspaceFolderPath, filename),
				);

				this.workspaceWatchers[workspaceFolderPath] = watcher;

				continue;
			}

			const watcher = fs.watch(
				workspaceNotepadFolderPath,
				{ encoding: 'utf8' }, (event, filename) => {
					(async () => {
						try {
							await this.notepadWatcher(event, workspaceFolderPath, filename);
						} catch (error) {
							console.error(`Error handling notepad watcher event: ${error}`);
						}
					})();
				},
			);

			this.notepadWatchers.push(watcher);
		}

		this.refreshNoteList().catch(console.error);
	}

	destroy() {
		for (const watcher of this.notepadWatchers)
			watcher.close();
		for (const watcher of Object.values(this.workspaceWatchers))
			watcher?.close();

		this.notepadWatchers = [];
		this.workspaceWatchers = {};
	}

	workspaceFolderPaths(): string[] {
		return Object.keys(this.notepads);
	}

	workspaceNotePaths(workspaceFolderPath: string): string[] {
		if (!this.notepads[workspaceFolderPath]) return [];

		return Object.keys(this.notepads[workspaceFolderPath]);
	}

	private async refreshNoteList() {
		this.notepads = {};

		const workspaceFolders = vscode.workspace.workspaceFolders ?? [];

		for (const workspaceFolder of workspaceFolders) {
			const workspaceFolderPath = workspaceFolder.uri.fsPath;
			const folderPath = path.join(workspaceFolderPath, getNotepadFolderName());
			const notesFilePaths = await this.listNotesInFolder(folderPath);

			this.notepads[workspaceFolderPath] = {};

			for (const noteFilePath of notesFilePaths) {
				const filename = path.basename(noteFilePath, getNotepadFileExtension());

				this.notepads[workspaceFolderPath][noteFilePath] = filename;
			}
		}
	}

	private async listNotesInFolder(folderPath: string): Promise<string[]> {
		const extension = getNotepadFileExtension();
		const files = await vscode.workspace.fs.readDirectory(vscode.Uri.file(folderPath));

		return files
			.filter(([_, fileType]) => fileType === vscode.FileType.File)
			.filter(([filename, _]) => path.extname(filename) === extension)
			.map(([filename, _]) => path.join(folderPath, filename));
	}

	private async workspaceWatcher(_: fs.WatchEventType, _workspaceFolderPath: string, eventFilename: string | null) {
		if (eventFilename !== getNotepadFolderName()) return;

		// Setup is expensive, but easier than reconciling the changes
		await this.setup();
	}

	private async notepadWatcher(event: fs.WatchEventType, workspaceFolderPath: string, eventFilename: string | null) {
		if (!eventFilename) return;
		if (event !== 'rename') return;

		// Check file extension matches
		if (path.extname(eventFilename) !== getNotepadFileExtension()) return;

		const workspaceNotepadFolderPath = path.join(workspaceFolderPath, getNotepadFolderName());
		const eventFilePath = path.join(workspaceNotepadFolderPath, eventFilename);

		// Check the file exists
		if (!await checkFileExists(eventFilePath)) {
			// Remove from the notepad store if it doesn't
			if (this.notepads[workspaceFolderPath]?.[eventFilePath])
				this.notepads[workspaceFolderPath][eventFilePath] = void 0;
		}

		// Check it is a file
		const stat = await vscode.workspace.fs.stat(vscode.Uri.file(eventFilePath));
		if (stat.type !== vscode.FileType.File) return;

		if (!this.notepads[workspaceFolderPath])
			this.notepads[workspaceFolderPath] = {};

		const filename = path.basename(eventFilePath, getNotepadFileExtension());

		this.notepads[workspaceFolderPath][eventFilePath] = filename;
		this.noteChangedEmitter.fire({
			noteFilePath: eventFilePath,
			workspaceFolderPath,
		});
	}

	onNoteChanged(listener: (e: NoteChangedEvent) => void, thisArgs?: unknown, disposables?: vscode.Disposable[]) {
		return this.noteChangedEmitter.event(listener, thisArgs, disposables);
	}
}

async function checkFileExists(filePath: string): Promise<boolean> {
	try {
		await vscode.workspace.fs.stat(vscode.Uri.file(filePath));

		return true;
	} catch (error) {
		if (error instanceof vscode.FileSystemError && error.code === 'FileNotFound') {
			return false;
		}

		throw error;
	}
}
