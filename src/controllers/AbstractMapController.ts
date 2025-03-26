import { Disposable, TextDocumentChangeEvent, TextDocument, workspace } from "vscode";

export abstract class AbstractMapController<TMap> {
    private readonly _disposable: Disposable;

    protected constructor
        (
            private readonly mapStore: Record<string, TMap>,
            private readonly matchTrigger: RegExp,
            private readonly mapFromDocument: (doc: TextDocument) => TMap
        ) {
        const subscriptions: Disposable[] = [
            workspace.onDidChangeTextDocument(this._handleTextChange, this)
        ];

        this._disposable = Disposable.from(...subscriptions);
    }

    private _handleTextChange({ contentChanges, document }: TextDocumentChangeEvent) {
        if (!contentChanges.some(change => this.matchTrigger.test(change.text))) return;
        const { fsPath } = document.uri;
        this.mapStore[fsPath] = this.mapFromDocument(document);
    }

    public dispose() {
        this._disposable.dispose();
    }
}

export async function generateMapsFromFiles<T>(
    loader: (fsPath: string) => Promise<T>
): Promise<Record<string, T>> {
    const allFiles = await workspace.findFiles("**/*.ink");
    const uniqueFiles = Array.from(new Map(allFiles.map(f => [f.fsPath, f])).values());

    const maps = await Promise.all(uniqueFiles.map(file => loader(file.fsPath)));
    const result: Record<string, T> = {};
    for (const map of maps) {
        const key = (map as any).filePath;
        result[key] = map;
    }
    return result;
}

export function findDefinition<T extends { name: string }>(
    name: string,
    filePath: string,
    maps: Record<string, any>,
    extractor: (map: any) => T[]
): T | null {
    const local = maps[filePath];
    if (local) {
        const found = extractor(local).find(def => def.name === name);
        if (found) return found;
    }

    for (const key in maps) {
        if (key === filePath) continue;
        const found = extractor(maps[key]).find(def => def.name === name);
        if (found) return found;
    }

    return null;
}


