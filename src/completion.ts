import { CompletionItemProvider, TextDocument, Position, CancellationToken, CompletionItem, Range, CompletionItemKind, workspace } from "vscode";
import * as fs from "fs";
import { getDivertCompletionTargets } from "./models/NodeController";

export class DivertCompletionProvider implements CompletionItemProvider {

    public provideCompletionItems (document: TextDocument, position: Position) : CompletionItem[] {
        // Make sure we are at the end of a valid divert arrow.
        // Ignore a > at the start of a line.
        const before = document.getText(new Range(position.with(position.line, 0), position));
        if (!/(->|<-) ?$/.test(before)) return;
        if (/-> ?-> ?$/.test(before)) return;
        return getDivertCompletionTargets(document.uri.fsPath, position.line);
    }
}