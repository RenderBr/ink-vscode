import { AbstractMapController, findDefinition, generateMapsFromFiles } from "./AbstractMapController";
import { FunctionMap } from "../models/FunctionMap";
import { FunctionDefinition } from "../models/definitions/FunctionDefinition";
import { VariableDefinition } from "../models/definitions/VariableDefinition";

const functionMaps: Record<string, FunctionMap> = {};

export class FunctionController extends AbstractMapController<FunctionMap> {
  constructor() {
    super(functionMaps, /[\n=]|EXTERNAL/, FunctionMap.fromDocument);
  }
}

export async function generateFunctionMaps(): Promise<void> {
  Object.assign(functionMaps, await generateMapsFromFiles(FunctionMap.from));
}

export function getFunctionDefinitionByName(name: string, filePath: string): FunctionDefinition | null {
  return findDefinition(name, filePath, functionMaps, m => m.functions);
}

export function getVariableDefinitionByName(name: string, filePath: string): VariableDefinition | null {
  return findDefinition(name, filePath, functionMaps, m => m.variables);
}
