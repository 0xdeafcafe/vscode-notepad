import * as vscode from 'vscode';
import { NotepadManager } from '../notepad-manager';
import path from 'node:path';

export class Notepad extends vscode.TreeItem {
	public readonly contextValue = 'notepad';

	constructor(
		public readonly name: string,
		public readonly location: string,
		public readonly command?: vscode.Command,
		collapsibleState?: vscode.TreeItemCollapsibleState, 
	) {
		super(name, collapsibleState);

		this.name = name;
		this.location = location;
		this.tooltip = this.name;
	}
}

export class Note extends vscode.TreeItem {
	public readonly contextValue = 'note';

	constructor(
		public readonly name: string,
		public readonly location: string
	) {
		super(name);

		this.name = name;
		this.location = location;
		this.tooltip = this.name;
		this.command = {
			command: 'vscode.open',
			title: 'Open note',
			arguments: [location],
		};
	}
}

export class NotepadTreeDataProvider implements vscode.TreeDataProvider<Notepad | Note> {
	private readonly notepadManager: NotepadManager;
	private _onDidChangeTreeData: vscode.EventEmitter<Notepad | Note | undefined> = new vscode.EventEmitter<Notepad | Note | undefined>();
	readonly onDidChangeTreeData: vscode.Event<Notepad | Note | undefined> = this._onDidChangeTreeData.event;


	constructor(notepadManager: NotepadManager) {
		this.notepadManager = notepadManager;
		this.notepadManager.onNoteChanged((event) => {
			const workspaceName = path.basename(event.workspaceFolderPath);
			const notepad = new Notepad(
				workspaceName,
				event.workspaceFolderPath,
				void 0,
				vscode.TreeItemCollapsibleState.Expanded,
			);

			this._onDidChangeTreeData.fire(notepad);
		});
	}

	getTreeItem(element: Notepad | Note): vscode.TreeItem | Thenable<vscode.TreeItem> {
		return element;
	}

	getChildren(element?: Notepad | Note | undefined): vscode.ProviderResult<(Notepad | Note)[]> {
		switch (true) {
			case element === void 0: {
				const workspaceFolderPaths = this.notepadManager.workspaceFolderPaths();
				const elements: Notepad[] = [];

				for (const workspaceFolderPath of workspaceFolderPaths) {
					const workspaceName = path.basename(workspaceFolderPath);
					const notepad = new Notepad(
						workspaceName,
						workspaceFolderPath,
						void 0,
						vscode.TreeItemCollapsibleState.Expanded,
					);

					elements.push(notepad);
				}

				return Promise.resolve(elements);
			}

			case element?.contextValue === 'notepad': {
				const workspaceNotePaths = this.notepadManager.workspaceNotePaths(element.location);
				const elements: Note[] = [];

				for (const workspaceNotePath of workspaceNotePaths) {
					const noteName = path.basename(workspaceNotePath);
					const note = new Note(noteName, workspaceNotePath);

					elements.push(note);
				}

				return Promise.resolve(elements);
			}


			default: return Promise.resolve([]);
		}
	}
}
