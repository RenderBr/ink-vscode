import { DivertTarget } from "./DivertTarget";
import { KnotNode } from "./KnotNode";
import { LabelNode } from "./LabelNode";

export class StitchNode extends DivertTarget {
    public readonly labels: LabelNode[];

    constructor(
        public readonly name: string,
        private readonly _relativeStart: number,
        private readonly _relativeEnd: number,
        public readonly parentKnot: KnotNode,
        textContent: string,
        private readonly lastLine: boolean = false
    ) {
        super(name);
        this.labels = this._extractLabels(textContent);
    }

    get line(): number {
        return this.startLine;
    }

    get startLine(): number {
        return this.parentKnot.startLine + this._relativeStart;
    }

    get endLine(): number {
        return this.parentKnot.startLine + this._relativeEnd + (this.lastLine ? 1 : 0);
    }

    get parentFile() {
        return this.parentKnot.parentFile;
    }

    private _extractLabels(text: string): LabelNode[] {
        const labelRegex = /^\s*[-*+]\s*\((\w+)\)/;
        const lines = text.split("\n");
        const labels: LabelNode[] = [];

        // iterate through each line of the stitch and extract labels
        for (let i = 0; i < lines.length; i++) {
            const match = labelRegex.exec(lines[i]);
            if (match) {
                labels.push(new LabelNode(match[1], i, this));
            }
        }

        return labels;
    }
}