import { TextDocument, workspace } from "vscode";
import * as fs from "fs";
import * as path from "path";

export interface FunctionDefinition {
    name: string;
    line: number;
    filePath: string;
    type: "EXTERNAL" | "FUNCTION"; // distinguishes between the two formats
}

export interface VariableDefinition {
    name: string;
    line: number;
    filePath: string;
    type: "VAR" | "TEMP";
}


export class FunctionMap {
    public readonly filePath: string;
    public readonly functions: FunctionDefinition[] = [];
    public readonly variables: VariableDefinition[] = [];

    private constructor(filePath: string, functions: FunctionDefinition[], variables: VariableDefinition[]) {
        this.filePath = filePath;
        this.functions = functions;
        this.variables = variables;
    }

    public static fromDocument(doc: TextDocument): FunctionMap {
        const filePath = doc.uri.fsPath;
        const text = doc.getText();
        const lines = text.split(/\r?\n/);

        const functions: FunctionDefinition[] = [];
        const variables: VariableDefinition[] = [];

        lines.forEach((line, i) => {
            // EXTERNAL function
            const externalMatch = line.match(/^\s*EXTERNAL\s+(\w+)\s*\(/i);
            if (externalMatch) {
                functions.push({
                    name: externalMatch[1],
                    line: i,
                    filePath,
                    type: "EXTERNAL"
                });
            }

            // === function style
            const functionMatch = line.match(/^\s*===\s*function\s+(\w+)\s*/i);
            if (functionMatch) {
                functions.push({
                    name: functionMatch[1],
                    line: i,
                    filePath,
                    type: "FUNCTION"
                });
            }

            // VAR declaration
            const varMatch = line.match(/^\s*VAR\s+(\w+)\s*=/i);
            if (varMatch) {
                variables.push({
                    name: varMatch[1],
                    line: i,
                    filePath,
                    type: "VAR"
                });
            }

            // TEMP declaration
            const tempMatch = line.match(/^\s*~\s*temp\s+(\w+)\s*=/i);
            if (tempMatch) {
                variables.push({
                    name: tempMatch[1],
                    line: i,
                    filePath,
                    type: "TEMP"
                });
            }
        });

        return new FunctionMap(filePath, functions, variables);
    }

    public static async from(filePath: string): Promise<FunctionMap> {
        const content = fs.readFileSync(filePath, "utf8");
        const lines = content.split(/\r?\n/);

        const functions: FunctionDefinition[] = [];
        const variables: VariableDefinition[] = [];

        lines.forEach((line, i) => {
            const externalMatch = line.match(/^\s*EXTERNAL\s+(\w+)\s*\(/i);
            if (externalMatch) {
                functions.push({
                    name: externalMatch[1],
                    line: i,
                    filePath,
                    type: "EXTERNAL"
                });
            }

            const functionMatch = line.match(/^\s*===\s*function\s+(\w+)\s*/i);
            if (functionMatch) {
                functions.push({
                    name: functionMatch[1],
                    line: i,
                    filePath,
                    type: "FUNCTION"
                });
            }

            const varMatch = line.match(/^\s*VAR\s+(\w+)\s*=/i);
            if (varMatch) {
                variables.push({
                    name: varMatch[1],
                    line: i,
                    filePath,
                    type: "VAR"
                });
            }

            const tempMatch = line.match(/^\s*~\s*temp\s+(\w+)\s*=/i);
            if (tempMatch) {
                variables.push({
                    name: tempMatch[1],
                    line: i,
                    filePath,
                    type: "TEMP"
                });
            }
        });

        return new FunctionMap(filePath, functions, variables);
    }
}
