import { CompletionItem, CompletionItemKind, Disposable, Location, Position, TextDocumentChangeEvent, Uri, workspace } from "vscode";
import { NodeMap } from "./NodeMap";
import { DivertTarget } from "./DivertTarget";
import { StitchNode } from "./StitchNode";

const nodeMaps: { [key: string]: NodeMap; } = {};
let mapsDone: boolean = false;

const PERMANENT_DIVERTS = [
    new CompletionItem("END", CompletionItemKind.Keyword),
    new CompletionItem("DONE", CompletionItemKind.Keyword),
    new CompletionItem("->", CompletionItemKind.Keyword)
]

export function getDivertCompletionTargets(filePath: string, line: number): CompletionItem[] { 
    return getDivertsInScope(filePath, line)
        .filter(target => target.name !== null)
        .map(target => target.toCompletionItem())
        .concat(PERMANENT_DIVERTS);
}

export class NodeController {
    private _disposable: Disposable;

    constructor() {
        let subscriptions: Disposable[] = [];
        workspace.onDidChangeTextDocument(this._onEvent, this, subscriptions);

        this._disposable = Disposable.from(...subscriptions);
    }

    private _onEvent({ contentChanges, document }: TextDocumentChangeEvent) {
        // Don't rebuild the entire file unless we have a new line or special character
        // suggesting the node map actually changed.
        if (!contentChanges.find(change => change.text.match(/[\n\*\+\(\)-=]/) !== null)) return;
        const { fsPath } = document.uri;
        nodeMaps[fsPath] = NodeMap.fromDocument(document);
    }

    public dispose() {
        this._disposable.dispose();
    }
}

export function generateMaps(): Thenable<void> {
    return Promise.all([
        workspace.findFiles("*.ink"),       // root directory
        workspace.findFiles("**/*.ink")     // subdirectories
    ])
    .then(([rootFiles, subFiles]) => {
        const allFiles = [...rootFiles, ...subFiles];

        // deduplicate by fsPath
        const uniqueFiles = Array.from(new Map(allFiles.map(f => [f.fsPath, f])).values());

        return Promise.all(uniqueFiles.map(({ fsPath }) => NodeMap.from(fsPath)));
    })
    .then((maps: NodeMap[]) => {
        maps.forEach(map => {
            nodeMaps[map.filePath] = map;
        });
        mapsDone = true;
    })
    .catch(err => {
        console.error("Error generating maps:", err);
    });
}

function getIncludeScope(filePath: string, knownScope: string[] = []): string[] {
    const fileMap = nodeMaps[filePath];
    if (!fileMap) return knownScope;
    if (knownScope.indexOf(filePath) === -1) knownScope.push(filePath);
    const newScope = fileMap.includes.filter(include => knownScope.indexOf(include) === -1);
    if (newScope.length < 1) return knownScope;
    return getIncludeScope(filePath, getIncludeScope(newScope[0], knownScope));

}

function stitchFor(filePath: string, line: number): StitchNode | null {
    const nodemap = nodeMaps[filePath]
    if (!nodemap) return null;
    const knot = nodemap.knots.find(knot => knot.startLine <= line && knot.endLine > line);
    if (!knot) {
        console.log("Can't identify knot for line ", line);
        return null;
    }
    const stitch = knot.stitches.find(stitch => stitch.startLine <= line && stitch.endLine > line);
    if (!stitch) {
        console.log("Can't identify stitch for line ", line);
        return null;
    }
    return stitch;
}

/* Gets the divert names that are in scope for a given line and file. */
function getDivertsInScope(filePath: string, line: number): DivertTarget[] {
    if (nodeMaps[filePath]) {
        let targets: DivertTarget[] = [];
        const scope = getIncludeScope(filePath);
        const knots = scope.map(path =>
            nodeMaps[path]
                .knots
        )
            .reduce((a, b) => a.concat(b));
        targets = targets.concat(knots);
        const currentStitch = stitchFor(filePath, line);
        if (currentStitch) {
            const stitches = currentStitch.parentKnot.stitches;
            const labels = currentStitch.labels;
            targets = targets.concat(stitches);
            targets = targets.concat(labels);
        } else {
            console.log("WARN: Couldn't find current stitch for line ", line);
        }

        console.log("Diverts in scope for", filePath, line, "=>", targets.map(t => t.name));
        return targets;
    }
    console.log(`Node map missing for file ${filePath}`);
    return [];
}

export function getDefinitionByNameAndScope(name: string, filePath: string, line: number): Location {
    let divert = getDivertsInScope(filePath, line)
    .find(target => target.name === name);

    if(!divert) {
    for (const key in nodeMaps) {
        const map = nodeMaps[key];
        const targets = getDivertsInScope(map.filePath, line);
        divert = targets.find(target => target.name === name);
        if (divert) break;
        }
    }

    if (!divert) {
        throw new Error(`No divert target named '${name}' found in scope at ${filePath}:${line}`);
    }
    return new Location(Uri.file(divert.parentFile.filePath), new Position(divert.line, 0));
}
