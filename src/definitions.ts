import {
    DefinitionProvider,
    Location,
    TextDocument,
    Position,
    Range,
    ProviderResult
  } from "vscode";
  import { getDefinitionByNameAndScope } from "./nodemap";
  
  export class InkDefinitionProvider implements DefinitionProvider {
    public provideDefinition(
      document: TextDocument,
      position: Position
    ): ProviderResult<Location> {
      const lineStart = new Position(position.line, 0);
      const lineEnd = new Position(position.line + 1, 0);
      const before = new Range(lineStart, position);
      const after = new Range(position, lineEnd);
      const beforeText = document.getText(before);
      const afterText = document.getText(after);
  
      const beforeMatch = beforeText.match(/(->\s*\w*)$/);
      const afterMatch = afterText.match(/^([\w\.]*)\s*/);
  
      if (!beforeMatch || !afterMatch) return;
  
      const combined = beforeMatch[1] + afterMatch[1];
      const nameMatch = combined.match(/->\s*([\w.]+)/);
      if (!nameMatch) return;
  
      const name = nameMatch[1];
      const [target] = name.split(".");
      return getDefinitionByNameAndScope(target, document.uri.fsPath, position.line);
    }
  }
  