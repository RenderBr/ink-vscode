import { DefinitionProvider,Location,TextDocument, Position, ProviderResult} from "vscode";
import { getDefinitionByNameAndScope } from "../controllers/NodeController";

export class InkDivertDefinitionProvider implements DefinitionProvider 
{
    private static readonly divertRegex = /->\s*([\w.]+)/;

    public provideDefinition(document: TextDocument, position: Position): ProviderResult<Location> {
      // Get the line of text at the cursor and match it against the divert regex.
      const lineText = document.lineAt(position.line).text;
      const cursorPos = position.character;

      const match = InkDivertDefinitionProvider.divertRegex.exec(lineText.slice(0, cursorPos) + lineText.slice(cursorPos));
      if (!match) return;

      // Get the target of the divert and return its definition.
      const [target] = match[1].split(".");
      return getDefinitionByNameAndScope(target, document.uri.fsPath, position.line);
    }
}
