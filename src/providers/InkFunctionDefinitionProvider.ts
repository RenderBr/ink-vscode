import { DefinitionProvider, Location, TextDocument, Position, ProviderResult, Uri} from "vscode";
import { getFunctionDefinitionByName } from "../controllers/FunctionController";

export class InkFunctionDefinitionProvider implements DefinitionProvider {
    private static readonly functionCallRegex = /\b([\w]+)\s*/;

    public provideDefinition(document: TextDocument, position: Position): ProviderResult<Location> 
    {
      const lineText = document.lineAt(position.line).text;

      // only care about logic lines, i.e lines that start with a tilde
      if (!lineText.trimStart().startsWith("~")) return;

      // match to see if the line contains a function call
      const match = InkFunctionDefinitionProvider.functionCallRegex.exec(lineText);
      if (!match) return;

      // get the name of the function and find its definition
      const functionName = match[1];
      const result = getFunctionDefinitionByName(functionName, document.uri.fsPath);
      if (!result) return;

      // return the location of the function definition
      return new Location(Uri.file(result.filePath), new Position(result.line, 0));
    }
}

