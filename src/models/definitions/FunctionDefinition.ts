export interface FunctionDefinition {
    name: string;
    line: number;
    filePath: string;
    type: "EXTERNAL" | "FUNCTION"; // distinguishes between the two formats
}