import {
    DefinitionProvider,
    Location,
    TextDocument,
    Position,
    ProviderResult,
    Uri
  } from "vscode";
import { getFunctionDefinitionByName } from "./models/FunctionController";
  
  
  export class InkFunctionDefinitionProvider implements DefinitionProvider {
    public provideDefinition(
      document: TextDocument,
      position: Position
    ): ProviderResult<Location> {
      const line = document.lineAt(position.line).text.trim();
  
      console.log("Line: ", line);
      // only care about logic lines
      if (!line.startsWith("~")) return;
  
      // try to find a function call: something like `myFunction(...)`
      const match = line.match(/\b([\w]+)\s*/);
      if (!match) return;
  
      const functionName = match[1];

      const result = getFunctionDefinitionByName(functionName, document.uri.fsPath);
      if (!result) return;
      
      return new Location(Uri.file(result.filePath), new Position(result.line, 0));
    }
  }
  