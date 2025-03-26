import { CompletionItem, CompletionItemKind, Location, Position, Uri, workspace } from "vscode";
import { AbstractMapController } from "./AbstractMapController";
import { NodeMap } from "../models/NodeMap";
import { StitchNode } from "../models/StitchNode";
import { DivertTarget } from "../models/DivertTarget";

// Global node map store
const nodeMaps: Record<string, NodeMap> = {};

// These are always available as completion targets, ignore scope
const PERMANENT_DIVERTS: CompletionItem[] = [
    new CompletionItem("END", CompletionItemKind.Keyword),
    new CompletionItem("DONE", CompletionItemKind.Keyword),
    new CompletionItem("->", CompletionItemKind.Keyword)
];

// Controller hooked to workspace change events
export class NodeController extends AbstractMapController<NodeMap> {
    constructor() {
        super(
            nodeMaps,
            /[\n*+\(\)\-=\[]/, // Trigger characters
            NodeMap.nodeMapFromDocument
        );
    }
}

// Loads all .ink files in the workspace and populates the nodeMaps
export async function generateNodeMaps(): Promise<void> {
    try {
        const allFiles = await workspace.findFiles("**/*.ink");
        const uniqueFiles = Array.from(new Map(allFiles.map(f => [f.fsPath, f])).values());

        const maps = await Promise.all(uniqueFiles.map(f => NodeMap.loadFromFilePath(f.fsPath)));
        maps.forEach(map => {
            nodeMaps[map.filePath] = map;
        });
    } catch (err) {
        console.error("Error generating node maps:", err);
    }
}

// Converts divert targets into VSCode CompletionItems
export function getDivertCompletionTargets(filePath: string, line: number): CompletionItem[] {
    return [
        ...getDivertsInScope(filePath, line)
            .filter(target => target.name)
            .map(target => target.toCompletionItem()),
        ...PERMANENT_DIVERTS
    ];
}

// Returns the StitchNode that contains the given line
function stitchFor(filePath: string, line: number): StitchNode | null {
    const map = nodeMaps[filePath];
    if (!map) return null;

    const knot = map.knots.find(k => k.startLine <= line && k.endLine > line);
    if (!knot) return null;

    return knot.stitches.find(s => s.startLine <= line && s.endLine > line) ?? null;
}

// Recursively gathers all included file paths starting from filePath
function getIncludeScope(filePath: string, visited: Set<string> = new Set()): string[] {
    if (visited.has(filePath)) return Array.from(visited);
    visited.add(filePath);

    const map = nodeMaps[filePath];
    if (!map) return Array.from(visited);

    for (const include of map.includes) {
        getIncludeScope(include, visited);
    }

    return Array.from(visited);
}

// Gets all divert targets in scope (local + includes + current stitch/labels)
function getDivertsInScope(filePath: string, line: number): DivertTarget[] {
    const map = nodeMaps[filePath];
    if (!map) return [];

    const scopeFiles = getIncludeScope(filePath);
    const targets: DivertTarget[] = scopeFiles.flatMap(path => nodeMaps[path]?.knots ?? []);

    const stitch = stitchFor(filePath, line);
    if (stitch) {
        targets.push(...stitch.parentKnot.stitches);
        targets.push(...stitch.labels);
    }

    return targets;
}

// Gets a Location for a divert target by name in scope
export function getDefinitionByNameAndScope(name: string, filePath: string, line: number): Location {
    let target = getDivertsInScope(filePath, line).find(t => t.name === name);

    if (!target) {
        for (const key in nodeMaps) {
            target = getDivertsInScope(key, line).find(t => t.name === name);
            if (target) break;
        }
    }

    if (!target) {
        throw new Error(`No divert target named '${name}' found in scope at ${filePath}:${line}`);
    }

    return new Location(Uri.file(target.parentFile.filePath), new Position(target.line, 0));
}  