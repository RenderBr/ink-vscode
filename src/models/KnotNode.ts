import { CompletionItem, CompletionItemKind } from "vscode";
import { DivertTarget } from "./DivertTarget";
import { StitchNode } from "./StitchNode";
import { NodeMap } from "./NodeMap";

export class KnotNode extends DivertTarget {
    public readonly stitches: StitchNode[];

    constructor
    (
        public readonly name: string | null,
        public readonly startLine: number,
        public readonly endLine: number,
        private readonly _parentFile: NodeMap,
        textContent: string,
        private readonly isFunction: boolean = false,
        private readonly lastLine: boolean = false
    ) 
    {
        super(name);
        this.stitches = this._parseStitches(textContent);
    }

    public get line(): number
    {
        return this.startLine;
    }

    public get parentFile(): NodeMap 
    {
        return this._parentFile;
    }

    public toCompletionItem(): CompletionItem 
    {
        const itemKind = this.isFunction ? CompletionItemKind.Function : CompletionItemKind.Reference;
        return new CompletionItem(this.name ?? "", itemKind);
    }

    private _parseStitches(content: string): StitchNode[] 
    {
        // split content into lines
        const lines = content.split("\n");
        const stitches: StitchNode[] = [];
      
        const stitchRegex = /^\s*=\s*(\w+)/;
      
        // track current stitch
        let currentName: string | null = null;
        let currentStart = 0;
        let currentLines: string[] = [];
      
        // push current stitch to stitches array
        const pushStitch = (end: number, isFinal: boolean = false) => {
          if (!currentName) return;
          const text = currentLines.join("\n");
          stitches.push(new StitchNode(currentName, currentStart, end, this, text, isFinal));
        };
      
        // iterate through lines and parse stitches
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const match = stitchRegex.exec(line);
      
          if (match) {
            // push previous before starting new
            if (currentLines.length > 0) {
              pushStitch(i);
            }
      
            currentName = match[1];
            currentStart = i;
            currentLines = [line];
          } else {
            currentLines.push(line);
          }
      
          // last line handling
          const isLastLine = i === lines.length - 1;
          if (isLastLine && currentName) {
            pushStitch(i + 1, this.lastLine);
          }
        }
      
        return stitches;
    }      
}
