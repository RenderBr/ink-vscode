import {
    Disposable,
    TextDocumentChangeEvent,
    workspace
} from "vscode";
import { FunctionDefinition, FunctionMap, VariableDefinition } from "./FunctionMap";

const functionMaps: { [key: string]: FunctionMap } = {};
let functionMapsDone: boolean = false;

export class FunctionController {
    private _disposable: Disposable;

    constructor() {
        let subscriptions: Disposable[] = [];
        workspace.onDidChangeTextDocument(this._onEvent, this, subscriptions);

        this._disposable = Disposable.from(...subscriptions);
    }

    private _onEvent({ contentChanges, document }: TextDocumentChangeEvent) {
        // Only update map if a line is likely to contain a function definition
        if (!contentChanges.find(change => change.text.match(/[\n=EXTERNAL]/i))) return;
        const { fsPath } = document.uri;
        functionMaps[fsPath] = FunctionMap.fromDocument(document);
    }

    public dispose() {
        this._disposable.dispose();
    }
}

export function generateFunctionMaps(): Thenable<void> {
    return Promise.all([
        workspace.findFiles("*.ink"),
        workspace.findFiles("**/*.ink")
    ])
    .then(([rootFiles, subFiles]) => {
        const allFiles = [...rootFiles, ...subFiles];
        const uniqueFiles = Array.from(new Map(allFiles.map(f => [f.fsPath, f])).values());

        return Promise.all(uniqueFiles.map(({ fsPath }) => FunctionMap.from(fsPath)));
    })
    .then((maps: FunctionMap[]) => {
        maps.forEach(map => {
            functionMaps[map.filePath] = map;
        });
        functionMapsDone = true;
    })
    .catch(err => {
        console.error("Error generating function maps:", err);
    });
}

export function getFunctionDefinitionByName(name: string, filePath: string): FunctionDefinition | null {
    const localMap = functionMaps[filePath];
    if (localMap) {
        const found = localMap.functions.find(f => f.name === name);
        if (found) return found as FunctionDefinition;
    }

    for (const key in functionMaps) {
        const map = functionMaps[key];
        const found = map.functions.find(f => f.name === name);
        if (found) return found;
    }

    return null;
}

export function getVariableDefinitionByName(name: string, filePath: string): VariableDefinition | null {
    const localMap = functionMaps[filePath];
    if (localMap) {
        const found = localMap.variables.find(v => v.name === name);
        if (found) return found;
    }

    for (const key in functionMaps) {
        const map = functionMaps[key];
        const found = map.variables.find(v => v.name === name);
        if (found) return found;
    }

    return null;
}
