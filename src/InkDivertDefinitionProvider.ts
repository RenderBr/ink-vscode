import {
  DefinitionProvider,
  Location,
  TextDocument,
  Position,
  ProviderResult
} from "vscode";
import { getDefinitionByNameAndScope } from "./nodemap";

export class InkDivertDefinitionProvider implements DefinitionProvider {
  public provideDefinition(
    document: TextDocument,
    position: Position
  ): ProviderResult<Location> {
    // Get the line of text at the cursor
    const line = document.lineAt(position.line).text;

    // Combine characters before and after the cursor for full word detection
    const cursorIndex = position.character;
    const before = line.slice(0, cursorIndex);
    const after = line.slice(cursorIndex);

    // Match the name of the target node
    const match = (before + after).match(/->\s*([\w.]+)/);
    if (!match) return;

    // Get the target node name
    const name = match[1];
    const [target] = name.split(".");

    // Find the definition of the target node
    return getDefinitionByNameAndScope(target, document.uri.fsPath, position.line);
  }
}
