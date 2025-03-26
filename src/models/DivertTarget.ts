import { CompletionItem, CompletionItemKind } from "vscode";
import { NodeMap } from "./NodeMap";

export abstract class DivertTarget {
    constructor(public readonly name: string | null) {}

    get line(): number 
    {
        throw new Error("Subclasses must implement 'line' getter");
    }

    get parentFile(): NodeMap 
    {
        throw new Error("Subclasses must implement 'parentFile' getter");
    }

    toCompletionItem(): CompletionItem 
    {
        return new CompletionItem(this.name ?? "", CompletionItemKind.Reference);
    }
}