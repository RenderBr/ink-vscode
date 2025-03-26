# Ink Language Support for Visual Studio Code

Provides advanced support for [Inkle's Ink language](https://github.com/inkle/ink) in Visual Studio Code. This extension adds syntax highlighting, IntelliSense completions, go-to definition for knots, stitches, functions, and variables, word count for .ink files.

This extension is not affiliated with Inkle Studios. Ink is a trademark of Inkle Studios Ltd. This extension was forked from [ink-vscode](https://github.com/sequitur/ink-vscode) by Bruno Dias, however it has been refactored and improved to provide more features and support for the Ink language.

## Features

- **Syntax Highlighting**: Utilizes the `.tmLanguage` grammar from the official Ink source.
- **Accurate Word & Node Count**: Ignores logic, comments, and declarations to only count actual story text. Displayed in the status bar.
- **IntelliSense Completion**:
  - Divert suggestions triggered on typing `->`, `-`, or space.
  - Includes suggestions for knots, stitches, and labels in the current file and its includes.
- **Go-to Definition**:
  - Works for divert targets (knots, stitches, labels).
  - Also works for user-defined functions and variables.
- **Definition Support**:
  - EXTERNAL and function-style declarations
  - `VAR` and `TEMP` variables
- **Node Mapping**:
  - Generates knot and stitch structure for each Ink file.
  - Supports included `.ink` files via `INCLUDE`.
- **Dynamic Map Updates**:
  - Updates on document changes, reducing recomputation for irrelevant edits.

## Getting Started

1. Install this extension from the marketplace.
2. Open or create `.ink` files.
3. Start writing! Features like highlighting, completions, and definitions will be automatically enabled.

## License

MIT – see [LICENSE](./LICENSE).