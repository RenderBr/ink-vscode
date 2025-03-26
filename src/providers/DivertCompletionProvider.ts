import { CompletionItemProvider, TextDocument, Position, CancellationToken, CompletionItem, Range, CompletionItemKind, workspace } from "vscode";
import { getDivertCompletionTargets } from "../controllers/NodeController";

export class DivertCompletionProvider implements CompletionItemProvider 
{
    private static readonly divertPattern = /(->|<-) ?$/;
    private static readonly doubleArrowPattern = /-> ?-> ?$/;

    public provideCompletionItems (document: TextDocument, position: Position) : CompletionItem[] {
        // Make sure we are at the end of a valid divert arrow.
        // Ignore a > at the start of a line.
        const lineText = document.getText(new Range(
            position.with(position.line, 0),
            position
        ));

        if (!DivertCompletionProvider.divertPattern.test(lineText)) return;
        if (DivertCompletionProvider.doubleArrowPattern.test(lineText)) return;
        
        return getDivertCompletionTargets(document.uri.fsPath, position.line);
    }
}