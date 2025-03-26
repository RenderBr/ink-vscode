import { DivertTarget } from "./DivertTarget";
import { NodeMap } from "./NodeMap";
import { StitchNode } from "./StitchNode";

export class LabelNode extends DivertTarget {
    constructor
    (
        public readonly name: string, 
        private readonly _line: number, 
        public readonly parentStitch: StitchNode
    ) 
    {
        super(name);
    }

    get line(): number 
    {
        return this._line + this.parentStitch.startLine;
    }

    get parentFile(): NodeMap 
    {
        return this.parentStitch.parentKnot.parentFile;
    }
}