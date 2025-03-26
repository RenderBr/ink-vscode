import { DivertTarget } from "./DivertTarget";
import { KnotNode } from "./KnotNode";
import { LabelNode } from "./LabelNode";

export class StitchNode extends DivertTarget {
    public readonly labels: LabelNode[]

    public get line() {
        return this.startLine;
    }

    public get startLine() {
        return this.parentKnot.startLine + this._relativeStart;
    }

    public get parentFile() {
        return this.parentKnot.parentFile;
    }

    public get endLine() {
        // On the last stich of the last knot in the file, we want the end line to actually be
        // the next line after the end of the file. This is why we track whether we're on the
        // last line or not when generating the map.
        return this.parentKnot.startLine + this._relativeEnd + (this.lastLine ? 1 : 0);
    }

    constructor(
        public readonly name: string,
        private readonly _relativeStart: number,
        private readonly _relativeEnd: number,
        public readonly parentKnot: KnotNode,
        textContent: string,
        private readonly lastLine: boolean = false
    ) {
        super(name);
        this.labels = textContent
            .split("\n")
            .map((line, index) => ({ found: line.match(/^\s*[-\*\+]\s*\((\w+)\)/), index }))
            .filter(({ found }) => found !== null)
            .map(({ found, index }) => new LabelNode(found[1], index, this));
    }
}