import path from "path";
import fs from "fs";
import { KnotNode } from "./KnotNode";
import { ProgressLocation, TextDocument } from "vscode";

export class NodeMap {
    static generateMaps(arg0: { location: ProgressLocation.Window; title: string; }, generateMaps: any) {
        throw new Error("Method not implemented.");
    }

    public readonly knots: KnotNode[];
    public readonly includes: string[];

    private constructor(public filePath: string, fileText: string) {
        const lines = fileText.split("\n");
        this.knots = lines
            .reduce((
                { nodes, currentNode, lastStart, lastName, isFunction }
                    : { nodes: KnotNode[], currentNode: string[], lastStart: number, lastName: string | null, isFunction }
                , line: string
                , index: number) => {
                if (line.match(/^\s*===(\s*function)?\s*(\w+)\s*===/)) {
                    // Found the start of a new knot.

                    const match = line.match(/^\s*===(\s*function)?\s*(\w+)\s*===/);
                    const newName = match[2];
                    const foundFunction = (!!match[1]);
                    const node = new KnotNode(lastName, lastStart, index, this, currentNode.join("\n"), isFunction);
                    nodes.push(node);
                    return { nodes, currentNode: [line], lastStart: index, lastName: newName, isFunction: foundFunction };
                }
                if (index === lines.length - 1) {
                    // Found the last line
                    const node = new KnotNode(lastName, lastStart, index + 1, this, currentNode.concat(line).join("\n"), false, true);
                    nodes.push(node);
                    return { nodes, currentNode: [line], lastStart: index, lastName: null, isFunction };
                }
                currentNode.push(line);
                return { nodes, currentNode, lastStart, lastName, isFunction };
            }, { nodes: [], currentNode: [], lastStart: 0, lastName: null, isFunction: false })
            .nodes;
        this.includes = lines
            .filter(line => line.match(/^\s*INCLUDE\s+(\w+\.ink)/))
            .map(line => {
                const filename = line.match(/^\s*INCLUDE\s+(\w+\.ink)/)[1];
                const dirname = path.dirname(filePath);
                return path.normalize(dirname + path.sep + filename);
            });

        console.log("Knots found:", this.knots.map(k => k.name));
    }

    public static from(filePath: string): Promise<NodeMap> {
        return new Promise<string>((resolve, reject) => {
            fs.readFile(filePath, 'utf8', (err, data: string) => {
                if (err) return reject(err);
                return resolve(data);
            });
        })
            .catch((err) => console.log("Error opening file: ", err))
            .then((data) => new NodeMap(filePath, data ? data : ""));
    }

    public static fromDocument(document: TextDocument): NodeMap {
        const { fsPath } = document.uri;
        return new NodeMap(fsPath, document.getText());
    }
}