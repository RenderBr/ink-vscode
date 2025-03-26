import {
    DefinitionProvider,
    Location,
    Position,
    ProviderResult,
    TextDocument,
    Uri
} from "vscode";
import { getVariableDefinitionByName } from "./models/FunctionController";

export class InkVariableDefinitionProvider implements DefinitionProvider {
    public provideDefinition(
        document: TextDocument,
        position: Position
    ): ProviderResult<Location> {
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) return;

        const variableName = document.getText(wordRange);
        if (!variableName) return;

        const result = getVariableDefinitionByName(variableName, document.uri.fsPath);
        if (!result) return;

        return new Location(Uri.file(result.filePath), new Position(result.line, 0));
    }
}
