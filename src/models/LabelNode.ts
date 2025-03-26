import { DivertTarget } from "./DivertTarget";
import { StitchNode } from "./StitchNode";

export class LabelNode extends DivertTarget {

    public get line() {
        return this._line + this.parentStitch.startLine;
    }

    public get parentFile() {
        return this.parentStitch.parentKnot.parentFile;
    }

    constructor(
        public readonly name: string,
        private readonly _line: number,
        public readonly parentStitch: StitchNode
    ) {
        super(name);
    }
}