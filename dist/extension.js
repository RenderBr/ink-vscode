"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate
});
module.exports = __toCommonJS(extension_exports);
var import_vscode10 = require("vscode");

// src/controllers/NodeController.ts
var import_vscode4 = require("vscode");

// src/controllers/AbstractMapController.ts
var import_vscode = require("vscode");
var AbstractMapController = class {
  constructor(mapStore, matchTrigger, mapFromDocument) {
    this.mapStore = mapStore;
    this.matchTrigger = matchTrigger;
    this.mapFromDocument = mapFromDocument;
    const subscriptions = [
      import_vscode.workspace.onDidChangeTextDocument(this._handleTextChange, this)
    ];
    this._disposable = import_vscode.Disposable.from(...subscriptions);
  }
  _handleTextChange({ contentChanges, document }) {
    if (!contentChanges.some((change) => this.matchTrigger.test(change.text))) return;
    const { fsPath } = document.uri;
    this.mapStore[fsPath] = this.mapFromDocument(document);
  }
  dispose() {
    this._disposable.dispose();
  }
};
async function generateMapsFromFiles(loader) {
  const allFiles = await import_vscode.workspace.findFiles("**/*.ink");
  const uniqueFiles = Array.from(new Map(allFiles.map((f) => [f.fsPath, f])).values());
  const maps = await Promise.all(uniqueFiles.map((file) => loader(file.fsPath)));
  const result = {};
  for (const map of maps) {
    const key = map.filePath;
    result[key] = map;
  }
  return result;
}
function findDefinition(name, filePath, maps, extractor) {
  const local = maps[filePath];
  if (local) {
    const found = extractor(local).find((def) => def.name === name);
    if (found) return found;
  }
  for (const key in maps) {
    if (key === filePath) continue;
    const found = extractor(maps[key]).find((def) => def.name === name);
    if (found) return found;
  }
  return null;
}

// src/models/NodeMap.ts
var import_path = __toESM(require("path"));
var import_fs = __toESM(require("fs"));

// src/models/KnotNode.ts
var import_vscode3 = require("vscode");

// src/models/DivertTarget.ts
var import_vscode2 = require("vscode");
var DivertTarget = class {
  constructor(name) {
    this.name = name;
  }
  get line() {
    throw new Error("Subclasses must implement 'line' getter");
  }
  get parentFile() {
    throw new Error("Subclasses must implement 'parentFile' getter");
  }
  toCompletionItem() {
    return new import_vscode2.CompletionItem(this.name ?? "", import_vscode2.CompletionItemKind.Reference);
  }
};

// src/models/LabelNode.ts
var LabelNode = class extends DivertTarget {
  constructor(name, _line, parentStitch) {
    super(name);
    this.name = name;
    this._line = _line;
    this.parentStitch = parentStitch;
  }
  get line() {
    return this._line + this.parentStitch.startLine;
  }
  get parentFile() {
    return this.parentStitch.parentKnot.parentFile;
  }
};

// src/models/StitchNode.ts
var StitchNode = class extends DivertTarget {
  constructor(name, _relativeStart, _relativeEnd, parentKnot, textContent, lastLine = false) {
    super(name);
    this.name = name;
    this._relativeStart = _relativeStart;
    this._relativeEnd = _relativeEnd;
    this.parentKnot = parentKnot;
    this.lastLine = lastLine;
    this.labels = this._extractLabels(textContent);
  }
  get line() {
    return this.startLine;
  }
  get startLine() {
    return this.parentKnot.startLine + this._relativeStart;
  }
  get endLine() {
    return this.parentKnot.startLine + this._relativeEnd + (this.lastLine ? 1 : 0);
  }
  get parentFile() {
    return this.parentKnot.parentFile;
  }
  _extractLabels(text) {
    const labelRegex = /^\s*[-*+]\s*\((\w+)\)/;
    const lines = text.split("\n");
    const labels = [];
    for (let i = 0; i < lines.length; i++) {
      const match = labelRegex.exec(lines[i]);
      if (match) {
        labels.push(new LabelNode(match[1], i, this));
      }
    }
    return labels;
  }
};

// src/models/KnotNode.ts
var KnotNode = class extends DivertTarget {
  constructor(name, startLine, endLine, _parentFile, textContent, isFunction = false, lastLine = false) {
    super(name);
    this.name = name;
    this.startLine = startLine;
    this.endLine = endLine;
    this._parentFile = _parentFile;
    this.isFunction = isFunction;
    this.lastLine = lastLine;
    this.stitches = this._parseStitches(textContent);
  }
  get line() {
    return this.startLine;
  }
  get parentFile() {
    return this._parentFile;
  }
  toCompletionItem() {
    const itemKind = this.isFunction ? import_vscode3.CompletionItemKind.Function : import_vscode3.CompletionItemKind.Reference;
    return new import_vscode3.CompletionItem(this.name ?? "", itemKind);
  }
  _parseStitches(content) {
    const lines = content.split("\n");
    const stitches = [];
    const stitchRegex = /^\s*=\s*(\w+)/;
    let currentName = null;
    let currentStart = 0;
    let currentLines = [];
    const pushStitch = (end, isFinal = false) => {
      if (!currentName) return;
      const text = currentLines.join("\n");
      stitches.push(new StitchNode(currentName, currentStart, end, this, text, isFinal));
    };
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = stitchRegex.exec(line);
      if (match) {
        if (currentLines.length > 0) {
          pushStitch(i);
        }
        currentName = match[1];
        currentStart = i;
        currentLines = [line];
      } else {
        currentLines.push(line);
      }
      const isLastLine = i === lines.length - 1;
      if (isLastLine && currentName) {
        pushStitch(i + 1, this.lastLine);
      }
    }
    return stitches;
  }
};

// src/models/NodeMap.ts
var NodeMap = class _NodeMap {
  constructor(filePath, fileText) {
    this.filePath = filePath;
    const lines = fileText.split("\n");
    this.knots = this._parseKnots(lines);
    this.includes = this._parseIncludes(lines);
    console.log("Knots found:", this.knots.map((k) => k.name));
  }
  _parseKnots(lines) {
    const knots = [];
    const headerRegex = /^\s*===(\s*function)?\s*(\w+)\s*===/;
    let currentLines = [];
    let lastStart = 0;
    let lastName = null;
    let isFunction = false;
    const pushKnot = (end, isFinal = false) => {
      if (lastName !== null) {
        const content = currentLines.join("\n");
        knots.push(new KnotNode(lastName, lastStart, end, this, content, isFunction, isFinal));
      }
    };
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
  _parseIncludes(lines) {
    const includeRegex = /^\s*INCLUDE\s+(\w+\.ink)/;
    return lines.map((line) => includeRegex.exec(line)).filter(Boolean).map((match) => {
      const filename = match[1];
      return import_path.default.resolve(import_path.default.dirname(this.filePath), filename);
    });
  }
  static async loadFromFilePath(filePath) {
    try {
      const data = await import_fs.default.promises.readFile(filePath, "utf8");
      return new _NodeMap(filePath, data);
    } catch (err) {
      console.error("Error opening file:", err);
      return new _NodeMap(filePath, "");
    }
  }
  static nodeMapFromDocument(document) {
    return new _NodeMap(document.uri.fsPath, document.getText());
  }
};

// src/controllers/NodeController.ts
var nodeMaps = {};
var PERMANENT_DIVERTS = [
  new import_vscode4.CompletionItem("END", import_vscode4.CompletionItemKind.Keyword),
  new import_vscode4.CompletionItem("DONE", import_vscode4.CompletionItemKind.Keyword),
  new import_vscode4.CompletionItem("->", import_vscode4.CompletionItemKind.Keyword)
];
var NodeController = class extends AbstractMapController {
  constructor() {
    super(
      nodeMaps,
      /[\n*+\(\)\-=\[]/,
      // Trigger characters
      NodeMap.nodeMapFromDocument
    );
  }
};
async function generateNodeMaps() {
  try {
    const allFiles = await import_vscode4.workspace.findFiles("**/*.ink");
    const uniqueFiles = Array.from(new Map(allFiles.map((f) => [f.fsPath, f])).values());
    const maps = await Promise.all(uniqueFiles.map((f) => NodeMap.loadFromFilePath(f.fsPath)));
    maps.forEach((map) => {
      nodeMaps[map.filePath] = map;
    });
  } catch (err) {
    console.error("Error generating node maps:", err);
  }
}
function getDivertCompletionTargets(filePath, line) {
  return [
    ...getDivertsInScope(filePath, line).filter((target) => target.name).map((target) => target.toCompletionItem()),
    ...PERMANENT_DIVERTS
  ];
}
function stitchFor(filePath, line) {
  const map = nodeMaps[filePath];
  if (!map) return null;
  const knot = map.knots.find((k) => k.startLine <= line && k.endLine > line);
  if (!knot) return null;
  return knot.stitches.find((s) => s.startLine <= line && s.endLine > line) ?? null;
}
function getIncludeScope(filePath, visited = /* @__PURE__ */ new Set()) {
  if (visited.has(filePath)) return Array.from(visited);
  visited.add(filePath);
  const map = nodeMaps[filePath];
  if (!map) return Array.from(visited);
  for (const include of map.includes) {
    getIncludeScope(include, visited);
  }
  return Array.from(visited);
}
function getDivertsInScope(filePath, line) {
  const map = nodeMaps[filePath];
  if (!map) return [];
  const scopeFiles = getIncludeScope(filePath);
  const targets = scopeFiles.flatMap((path2) => nodeMaps[path2]?.knots ?? []);
  const stitch = stitchFor(filePath, line);
  if (stitch) {
    targets.push(...stitch.parentKnot.stitches);
    targets.push(...stitch.labels);
  }
  return targets;
}
function getDefinitionByNameAndScope(name, filePath, line) {
  let target = getDivertsInScope(filePath, line).find((t) => t.name === name);
  if (!target) {
    for (const key in nodeMaps) {
      target = getDivertsInScope(key, line).find((t) => t.name === name);
      if (target) break;
    }
  }
  if (!target) {
    throw new Error(`No divert target named '${name}' found in scope at ${filePath}:${line}`);
  }
  return new import_vscode4.Location(import_vscode4.Uri.file(target.parentFile.filePath), new import_vscode4.Position(target.line, 0));
}

// src/providers/InkDivertDefinitionProvider.ts
var InkDivertDefinitionProvider = class _InkDivertDefinitionProvider {
  static {
    this.divertRegex = /->\s*([\w.]+)/;
  }
  provideDefinition(document, position) {
    const lineText = document.lineAt(position.line).text;
    const cursorPos = position.character;
    const match = _InkDivertDefinitionProvider.divertRegex.exec(lineText.slice(0, cursorPos) + lineText.slice(cursorPos));
    if (!match) return;
    const [target] = match[1].split(".");
    return getDefinitionByNameAndScope(target, document.uri.fsPath, position.line);
  }
};

// src/providers/InkFunctionDefinitionProvider.ts
var import_vscode5 = require("vscode");

// src/models/FunctionMap.ts
var fs2 = __toESM(require("fs"));
var FunctionMap = class _FunctionMap {
  constructor(filePath, functions, variables) {
    this.functions = [];
    this.variables = [];
    this.filePath = filePath;
    this.functions = functions;
    this.variables = variables;
  }
  static fromDocument(doc) {
    const filePath = doc.uri.fsPath;
    const text = doc.getText();
    const lines = text.split(/\r?\n/);
    const functions = [];
    const variables = [];
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
    return new _FunctionMap(filePath, functions, variables);
  }
  static async from(filePath) {
    const content = fs2.readFileSync(filePath, "utf8");
    const lines = content.split(/\r?\n/);
    const functions = [];
    const variables = [];
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
    return new _FunctionMap(filePath, functions, variables);
  }
};

// src/controllers/FunctionController.ts
var functionMaps = {};
var FunctionController = class extends AbstractMapController {
  constructor() {
    super(functionMaps, /[\n=]|EXTERNAL/, FunctionMap.fromDocument);
  }
};
async function generateFunctionMaps() {
  Object.assign(functionMaps, await generateMapsFromFiles(FunctionMap.from));
}
function getFunctionDefinitionByName(name, filePath) {
  return findDefinition(name, filePath, functionMaps, (m) => m.functions);
}
function getVariableDefinitionByName(name, filePath) {
  return findDefinition(name, filePath, functionMaps, (m) => m.variables);
}

// src/providers/InkFunctionDefinitionProvider.ts
var InkFunctionDefinitionProvider = class _InkFunctionDefinitionProvider {
  static {
    this.functionCallRegex = /\b([\w]+)\s*/;
  }
  provideDefinition(document, position) {
    const lineText = document.lineAt(position.line).text;
    if (!lineText.trimStart().startsWith("~")) return;
    const match = _InkFunctionDefinitionProvider.functionCallRegex.exec(lineText);
    if (!match) return;
    const functionName = match[1];
    const result = getFunctionDefinitionByName(functionName, document.uri.fsPath);
    if (!result) return;
    return new import_vscode5.Location(import_vscode5.Uri.file(result.filePath), new import_vscode5.Position(result.line, 0));
  }
};

// src/providers/DivertCompletionProvider.ts
var import_vscode6 = require("vscode");
var DivertCompletionProvider = class _DivertCompletionProvider {
  static {
    this.divertPattern = /(->|<-) ?$/;
  }
  static {
    this.doubleArrowPattern = /-> ?-> ?$/;
  }
  provideCompletionItems(document, position) {
    const lineText = document.getText(new import_vscode6.Range(
      position.with(position.line, 0),
      position
    ));
    if (!_DivertCompletionProvider.divertPattern.test(lineText)) return;
    if (_DivertCompletionProvider.doubleArrowPattern.test(lineText)) return;
    return getDivertCompletionTargets(document.uri.fsPath, position.line);
  }
};

// src/providers/InkVariableDefinitionProvider.ts
var import_vscode7 = require("vscode");
var InkVariableDefinitionProvider = class {
  provideDefinition(document, position) {
    const wordRange = document.getWordRangeAtPosition(position);
    if (!wordRange) return;
    const variableName = document.getText(wordRange);
    if (!variableName) return;
    const result = getVariableDefinitionByName(variableName, document.uri.fsPath);
    if (!result) return;
    return new import_vscode7.Location(import_vscode7.Uri.file(result.filePath), new import_vscode7.Position(result.line, 0));
  }
};

// src/controllers/WordCountController.ts
var import_vscode8 = require("vscode");
var WordNodeCounterController = class {
  constructor(wordCounter) {
    this.wordCounter = wordCounter;
    this.wordCounter.updateWordCount();
    const subscriptions = [
      import_vscode8.window.onDidChangeTextEditorSelection(this._onEvent, this),
      import_vscode8.window.onDidChangeActiveTextEditor(this._onEvent, this)
    ];
    this._disposable = import_vscode8.Disposable.from(...subscriptions);
  }
  _onEvent() {
    this.wordCounter.updateWordCount();
  }
  dispose() {
    this._disposable.dispose();
  }
};

// src/controllers/WordCounterService.ts
var import_vscode9 = require("vscode");
var WordCounterService = class {
  plural(n, word) {
    return `${n} ${word}${n === 1 ? "" : "s"}`;
  }
  updateWordCount() {
    const editor = import_vscode9.window.activeTextEditor;
    if (!editor) {
      this._statusBarItem.hide();
      return;
    }
    const doc = editor.document;
    if (doc.languageId !== "ink") {
      this._statusBarItem.hide();
      return;
    }
    if (!this._statusBarItem) {
      this._statusBarItem = import_vscode9.window.createStatusBarItem(import_vscode9.StatusBarAlignment.Left);
    }
    const docContent = doc.getText();
    const wordCount = this._getWordCount(docContent);
    const nodeCount = this._getNodeCount(docContent);
    this._statusBarItem.text = `$(pencil) ${this.plural(wordCount, "word")} in ${this.plural(nodeCount, "node")}`;
    this._statusBarItem.show();
  }
  _getWordCount(content) {
    const lines = content.split("\n");
    const cleaned = this._stripMultilineBlocks(lines).map((line) => this._stripCommentsAndBlocks(line)).filter((line) => this._isNarrativeLine(line));
    const text = cleaned.join(" ");
    return text.split(/\s+/).filter((word) => /\w/.test(word)).length;
  }
  _stripCommentsAndBlocks(line) {
    line = line.replace(/\/\/.*$/, "");
    line = line.replace(/\{.*?\}/g, "");
    line = line.replace(/\/\*.*?\*\//g, "");
    return line.trim();
  }
  _isNarrativeLine(line) {
    if (line.trim().length === 0) return false;
    if (/^\s*(~|=|VAR|EXTERNAL|INCLUDE)/.test(line)) return false;
    return true;
  }
  _stripMultilineBlocks(lines) {
    let inBlock = false;
    let inComment = false;
    const result = [];
    for (let line of lines) {
      if (inBlock) {
        if (line.includes("}")) {
          inBlock = false;
          line = line.split("}")[1] || "";
        } else continue;
      }
      if (inComment) {
        if (line.includes("*/")) {
          inComment = false;
          line = line.split("*/")[1] || "";
        } else continue;
      }
      if (line.includes("/*") && !line.includes("*/")) {
        inComment = true;
        continue;
      }
      if (line.includes("{") && !line.includes("}")) {
        inBlock = true;
        continue;
      }
      result.push(line);
    }
    return result;
  }
  _getNodeCount(docContent) {
    return docContent.split("\n").filter((line) => line.match(/^\s*=/)).length;
  }
  dispose() {
    this._statusBarItem.dispose();
  }
};

// src/extension.ts
var INK = { language: "ink" };
function activate(context) {
  const disposables = [];
  const wordCounter = new WordCounterService();
  const wordCounterController = new WordNodeCounterController(wordCounter);
  const nodeController = new NodeController();
  const functionController = new FunctionController();
  disposables.push(wordCounter, wordCounterController, nodeController, functionController);
  (async () => {
    try {
      await Promise.all([
        import_vscode10.window.withProgress({ location: import_vscode10.ProgressLocation.Window, title: "Mapping knots and stitches..." }, generateNodeMaps),
        import_vscode10.window.withProgress({ location: import_vscode10.ProgressLocation.Window, title: "Mapping function declarations..." }, generateFunctionMaps)
      ]);
    } catch (err) {
      console.error("Error while mapping:", err);
    }
  })();
  disposables.push(
    import_vscode10.languages.registerCompletionItemProvider(INK, new DivertCompletionProvider(), ">", "-", " "),
    import_vscode10.languages.registerDefinitionProvider(INK, new InkDivertDefinitionProvider()),
    import_vscode10.languages.registerDefinitionProvider(INK, new InkFunctionDefinitionProvider()),
    import_vscode10.languages.registerDefinitionProvider(INK, new InkVariableDefinitionProvider())
  );
  context.subscriptions.push(...disposables);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate
});
//# sourceMappingURL=extension.js.map