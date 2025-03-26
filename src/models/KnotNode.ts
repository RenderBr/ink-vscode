import { CompletionItem, CompletionItemKind } from "vscode";
import { DivertTarget } from "./DivertTarget";
import { StitchNode } from "./StitchNode";
import { NodeMap } from "./NodeMap";

export class KnotNode extends DivertTarget {

    public readonly stitches;

    public get line() {
        return this.startLine;
    }

    constructor(
        public readonly name: string | null,
        public readonly startLine: number,
        public readonly endLine: number,
        private readonly _parentFile: NodeMap,
        textContent: string,
        private readonly isFunction: boolean = false,
        private readonly lastLine: boolean = false
    ) {
        super(name);
        const lines = textContent.split("\n");
        this.stitches = lines
            .reduce((
                { nodes, currentNode, lastStart, lastName }
                    : { nodes: StitchNode[], currentNode: string[], lastStart: number, lastName: string | null }
                , line: string
                , index: number) => {
                if (line.match(/^\s*={1}\s*(\w+)/)) {
                    // Found the start of a new stitch.
                    const newName = line.match(/^\s*={1}\s*(\w+)/)[1];
                    const node = new StitchNode(lastName, lastStart, index, this, currentNode.join("\n"));
                    nodes.push(node);
                    if (index === lines.length - 1) {
                        // The new stitch is also the last line of the knot.
                        const node = new StitchNode(newName, index, index + 1, this, currentNode.join("\n"), this.lastLine);
                        nodes.push(node);
                    }
                    return { nodes, currentNode: [line], lastStart: index, lastName: newName };
                }
                if (index === lines.length - 1) {
                    // Found the last line.
                    const node = new StitchNode(lastName, lastStart, index + 1, this, currentNode.join("\n"), this.lastLine);
                    nodes.push(node);
                    return { nodes, currentNode: [line], lastStart: index, lastName: null };
                }
                currentNode.push(line);
                return { nodes, currentNode, lastStart, lastName };
            }, { nodes: [], currentNode: [], lastStart: 0, lastName: null })
            .nodes;
    }

    public get parentFile(): NodeMap {
        return this._parentFile;
    }

    public toCompletionItem(): CompletionItem {
        const itemKind = this.isFunction ? CompletionItemKind.Function : CompletionItemKind.Reference;
        return new CompletionItem(this.name, itemKind);
    }
}
