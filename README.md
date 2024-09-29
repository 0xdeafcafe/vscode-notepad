# vscode-notepad

This is a simple notepad extension for Visual Studio Code. It allows you to create, edit, and save note inside the editor.

## Features

Easily create, edit, and save notes inside the editor. Notes are saved in a special hidden folder inside the currently open workspace (folder). If you have multiple workspaces open, then you can select which workspace to save the note in.

Notes are also prefixed with a date, so you can easily see when the note was created.

\!\[animation showing the lifecycle of a note\]\(images/feature-x.png\)

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `notepad.noteFolderName` - The folder name where the notes will be saved inside a workspace folder. The default is `.notepad`.
* `notepad.noteFileExtension` - The file extension for the notes. The default is `.md`.
* `notepad.notePrefixFormat` - The format for the date at the start of the note filename. The default is `YYYY-MM-dd`. This format uses `date-fns` format tokens, which are documented [here](https://date-fns.org/v4.1.0/docs/format).

## Release Notes

Users appreciate release notes as you update your extension.

### 0.0.1

The initial release includes creating, editing, saving, listing, and deleting notes.

**Enjoy!**
