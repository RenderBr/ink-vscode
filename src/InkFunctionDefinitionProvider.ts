import {
    DefinitionProvider,
    Location,
    TextDocument,
    Position,
    ProviderResult
  } from "vscode";
  
  import { getDefinitionByNameAndScope } from "./nodemap";
  
  export class InkFunctionDefinitionProvider implements DefinitionProvider {
    public provideDefinition(
      document: TextDocument,
      position: Position
    ): ProviderResult<Location> {
      const line = document.lineAt(position.line).text.trim();
  
      // only care about logic lines
      if (!line.startsWith("~")) return;
  
      // try to find a function call: something like `myFunction(...)`
      const match = line.match(/\b([\w]+)\s*\(/);
      if (!match) return;
  
      const functionName = match[1];
  
      // use same helper, assuming it supports function name lookup too
      return getDefinitionByNameAndScope(functionName, document.uri.fsPath, position.line);
    }
  }
  