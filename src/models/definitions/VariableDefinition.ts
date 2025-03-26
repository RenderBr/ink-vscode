export interface VariableDefinition {
    name: string;
    line: number;
    filePath: string;
    type: "VAR" | "TEMP";
}