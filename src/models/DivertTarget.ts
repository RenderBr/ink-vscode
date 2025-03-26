import { CompletionItem, CompletionItemKind } from "vscode";
import { NodeMap } from "./NodeMap";

export class DivertTarget {
    constructor(public readonly name: string | null) { }
    public get line(): number {
        throw new Error("line accessor must be overridden in subclass");

    };
    public get parentFile(): NodeMap {
        throw new Error("parentFile accessor must be implemented in subclass");
    }
    public toCompletionItem(): CompletionItem {
        return new CompletionItem(this.name, CompletionItemKind.Reference);
    }
}