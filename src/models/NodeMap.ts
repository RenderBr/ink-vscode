import path from "path";
import fs from "fs";
import { KnotNode } from "./KnotNode";
import { TextDocument } from "vscode";

export class NodeMap {
    public readonly knots: KnotNode[];
    public readonly includes: string[];

    private constructor(public readonly filePath: string, fileText: string) {
        const lines = fileText.split("\n");

        this.knots = this._parseKnots(lines);
        this.includes = this._parseIncludes(lines);

        console.log("Knots found:", this.knots.map(k => k.name));
    }

    private _parseKnots(lines: string[]): KnotNode[] {
        const knots: KnotNode[] = [];

        const headerRegex = /^\s*===(\s*function)?\s*(\w+)\s*===/;

        let currentLines: string[] = [];
        let lastStart = 0;
        let lastName: string | null = null;
        let isFunction = false;

        // Pushes the current knot to the list of knots
        const pushKnot = (end: number, isFinal = false) => {
            if (lastName !== null) {
                const content = currentLines.join("\n");
                knots.push(new KnotNode(lastName, lastStart, end, this, content, isFunction, isFinal));
            }
        };

        // Iterate over each line in the file, parsing knot headers
        lines.forEach((line, index) => {
            const match = headerRegex.exec(line);

            if (match) {
                pushKnot(index);
                lastName = match[2];
                isFunction = !!match[1];
                lastStart = index;
                currentLines = [line];
            } else {
                currentLines.push(line);
                if (index === lines.length - 1) {
                    pushKnot(index + 1, true);
                }
            }
        });

        return knots;
    }

    private _parseIncludes(lines: string[]): string[] {
        const includeRegex = /^\s*INCLUDE\s+(\w+\.ink)/;

        return lines
            .map(line => includeRegex.exec(line))
            .filter(Boolean)
            .map(match => {
                const filename = match![1];
                return path.resolve(path.dirname(this.filePath), filename);
            });
    }

    public static async loadFromFilePath(filePath: string): Promise<NodeMap> {
        try {
            const data = await fs.promises.readFile(filePath, "utf8");
            return new NodeMap(filePath, data);
        } catch (err) {
            console.error("Error opening file:", err);
            return new NodeMap(filePath, "");
        }
    }

    public static nodeMapFromDocument(document: TextDocument): NodeMap {
        return new NodeMap(document.uri.fsPath, document.getText());
    }
}