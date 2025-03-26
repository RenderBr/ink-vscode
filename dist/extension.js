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
var import_vscode9 = require("vscode");

// src/models/NodeController.ts
var import_vscode3 = require("vscode");

// src/models/NodeMap.ts
var import_path = __toESM(require("path"));
var import_fs = __toESM(require("fs"));

// src/models/KnotNode.ts
var import_vscode2 = require("vscode");

// src/models/DivertTarget.ts
var import_vscode = require("vscode");
var DivertTarget = class {
  constructor(name) {
    this.name = name;
  }
  get line() {
    throw new Error("line accessor must be overridden in subclass");
  }
  get parentFile() {
    throw new Error("parentFile accessor must be implemented in subclass");
  }
  toCompletionItem() {
    return new import_vscode.CompletionItem(this.name, import_vscode.CompletionItemKind.Reference);
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
    this.labels = textContent.split("\n").map((line, index) => ({ found: line.match(/^\s*[-\*\+]\s*\((\w+)\)/), index })).filter(({ found }) => found !== null).map(({ found, index }) => new LabelNode(found[1], index, this));
  }
  get line() {
    return this.startLine;
  }
  get startLine() {
    return this.parentKnot.startLine + this._relativeStart;
  }
  get parentFile() {
    return this.parentKnot.parentFile;
  }
  get endLine() {
    return this.parentKnot.startLine + this._relativeEnd + (this.lastLine ? 1 : 0);
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
    const lines = textContent.split("\n");
    this.stitches = lines.reduce(({ nodes, currentNode, lastStart, lastName }, line, index) => {
      if (line.match(/^\s*={1}\s*(\w+)/)) {
        const newName = line.match(/^\s*={1}\s*(\w+)/)[1];
        const node = new StitchNode(lastName, lastStart, index, this, currentNode.join("\n"));
        nodes.push(node);
        if (index === lines.length - 1) {
          const node2 = new StitchNode(newName, index, index + 1, this, currentNode.join("\n"), this.lastLine);
          nodes.push(node2);
        }
        return { nodes, currentNode: [line], lastStart: index, lastName: newName };
      }
      if (index === lines.length - 1) {
        const node = new StitchNode(lastName, lastStart, index + 1, this, currentNode.join("\n"), this.lastLine);
        nodes.push(node);
        return { nodes, currentNode: [line], lastStart: index, lastName: null };
      }
      currentNode.push(line);
      return { nodes, currentNode, lastStart, lastName };
    }, { nodes: [], currentNode: [], lastStart: 0, lastName: null }).nodes;
  }
  get line() {
    return this.startLine;
  }
  get parentFile() {
    return this._parentFile;
  }
  toCompletionItem() {
    const itemKind = this.isFunction ? import_vscode2.CompletionItemKind.Function : import_vscode2.CompletionItemKind.Reference;
    return new import_vscode2.CompletionItem(this.name, itemKind);
  }
};

// src/models/NodeMap.ts
var NodeMap = class _NodeMap {
  constructor(filePath, fileText) {
    this.filePath = filePath;
    const lines = fileText.split("\n");
    this.knots = lines.reduce(({ nodes, currentNode, lastStart, lastName, isFunction }, line, index) => {
      if (line.match(/^\s*===(\s*function)?\s*(\w+)\s*===/)) {
        const match = line.match(/^\s*===(\s*function)?\s*(\w+)\s*===/);
        const newName = match[2];
        const foundFunction = !!match[1];
        const node = new KnotNode(lastName, lastStart, index, this, currentNode.join("\n"), isFunction);
        nodes.push(node);
        return { nodes, currentNode: [line], lastStart: index, lastName: newName, isFunction: foundFunction };
      }
      if (index === lines.length - 1) {
        const node = new KnotNode(lastName, lastStart, index + 1, this, currentNode.concat(line).join("\n"), false, true);
        nodes.push(node);
        return { nodes, currentNode: [line], lastStart: index, lastName: null, isFunction };
      }
      currentNode.push(line);
      return { nodes, currentNode, lastStart, lastName, isFunction };
    }, { nodes: [], currentNode: [], lastStart: 0, lastName: null, isFunction: false }).nodes;
    this.includes = lines.filter((line) => line.match(/^\s*INCLUDE\s+(\w+\.ink)/)).map((line) => {
      const filename = line.match(/^\s*INCLUDE\s+(\w+\.ink)/)[1];
      const dirname = import_path.default.dirname(filePath);
      return import_path.default.normalize(dirname + import_path.default.sep + filename);
    });
    console.log("Knots found:", this.knots.map((k) => k.name));
  }
  static generateMaps(arg0, generateMaps2) {
    throw new Error("Method not implemented.");
  }
  static from(filePath) {
    return new Promise((resolve, reject) => {
      import_fs.default.readFile(filePath, "utf8", (err, data) => {
        if (err) return reject(err);
        return resolve(data);
      });
    }).catch((err) => console.log("Error opening file: ", err)).then((data) => new _NodeMap(filePath, data ? data : ""));
  }
  static fromDocument(document) {
    const { fsPath } = document.uri;
    return new _NodeMap(fsPath, document.getText());
  }
};

// src/models/NodeController.ts
var nodeMaps = {};
var mapsDone = false;
var PERMANENT_DIVERTS = [
  new import_vscode3.CompletionItem("END", import_vscode3.CompletionItemKind.Keyword),
  new import_vscode3.CompletionItem("DONE", import_vscode3.CompletionItemKind.Keyword),
  new import_vscode3.CompletionItem("->", import_vscode3.CompletionItemKind.Keyword)
];
function getDivertCompletionTargets(filePath, line) {
  return getDivertsInScope(filePath, line).filter((target) => target.name !== null).map((target) => target.toCompletionItem()).concat(PERMANENT_DIVERTS);
}
var NodeController = class {
  constructor() {
    let subscriptions = [];
    import_vscode3.workspace.onDidChangeTextDocument(this._onEvent, this, subscriptions);
    this._disposable = import_vscode3.Disposable.from(...subscriptions);
  }
  _onEvent({ contentChanges, document }) {
    if (!contentChanges.find((change) => change.text.match(/[\n\*\+\(\)-=]/) !== null)) return;
    const { fsPath } = document.uri;
    nodeMaps[fsPath] = NodeMap.fromDocument(document);
  }
  dispose() {
    this._disposable.dispose();
  }
};
function generateMaps() {
  return Promise.all([
    import_vscode3.workspace.findFiles("*.ink"),
    // root directory
    import_vscode3.workspace.findFiles("**/*.ink")
    // subdirectories
  ]).then(([rootFiles, subFiles]) => {
    const allFiles = [...rootFiles, ...subFiles];
    const uniqueFiles = Array.from(new Map(allFiles.map((f) => [f.fsPath, f])).values());
    return Promise.all(uniqueFiles.map(({ fsPath }) => NodeMap.from(fsPath)));
  }).then((maps) => {
    maps.forEach((map) => {
      nodeMaps[map.filePath] = map;
    });
    mapsDone = true;
  }).catch((err) => {
    console.error("Error generating maps:", err);
  });
}
function getIncludeScope(filePath, knownScope = []) {
  const fileMap = nodeMaps[filePath];
  if (!fileMap) return knownScope;
  if (knownScope.indexOf(filePath) === -1) knownScope.push(filePath);
  const newScope = fileMap.includes.filter((include) => knownScope.indexOf(include) === -1);
  if (newScope.length < 1) return knownScope;
  return getIncludeScope(filePath, getIncludeScope(newScope[0], knownScope));
}
function stitchFor(filePath, line) {
  const nodemap = nodeMaps[filePath];
  if (!nodemap) return null;
  const knot = nodemap.knots.find((knot2) => knot2.startLine <= line && knot2.endLine > line);
  if (!knot) {
    console.log("Can't identify knot for line ", line);
    return null;
  }
  const stitch = knot.stitches.find((stitch2) => stitch2.startLine <= line && stitch2.endLine > line);
  if (!stitch) {
    console.log("Can't identify stitch for line ", line);
    return null;
  }
  return stitch;
}
function getDivertsInScope(filePath, line) {
  if (nodeMaps[filePath]) {
    let targets = [];
    const scope = getIncludeScope(filePath);
    const knots = scope.map(
      (path2) => nodeMaps[path2].knots
    ).reduce((a, b) => a.concat(b));
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
    console.log("Diverts in scope for", filePath, line, "=>", targets.map((t) => t.name));
    return targets;
  }
  console.log(`Node map missing for file ${filePath}`);
  return [];
}
function getDefinitionByNameAndScope(name, filePath, line) {
  let divert = getDivertsInScope(filePath, line).find((target) => target.name === name);
  if (!divert) {
    for (const key in nodeMaps) {
      const map = nodeMaps[key];
      const targets = getDivertsInScope(map.filePath, line);
      divert = targets.find((target) => target.name === name);
      if (divert) break;
    }
  }
  if (!divert) {
    throw new Error(`No divert target named '${name}' found in scope at ${filePath}:${line}`);
  }
  return new import_vscode3.Location(import_vscode3.Uri.file(divert.parentFile.filePath), new import_vscode3.Position(divert.line, 0));
}

// src/InkDivertDefinitionProvider.ts
var InkDivertDefinitionProvider = class {
  provideDefinition(document, position) {
    const line = document.lineAt(position.line).text;
    const cursorIndex = position.character;
    const before = line.slice(0, cursorIndex);
    const after = line.slice(cursorIndex);
    const match = (before + after).match(/->\s*([\w.]+)/);
    if (!match) return;
    const name = match[1];
    const [target] = name.split(".");
    return getDefinitionByNameAndScope(target, document.uri.fsPath, position.line);
  }
};

// src/InkFunctionDefinitionProvider.ts
var import_vscode5 = require("vscode");

// src/models/FunctionController.ts
var import_vscode4 = require("vscode");

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

// src/models/FunctionController.ts
var functionMaps = {};
var functionMapsDone = false;
var FunctionController = class {
  constructor() {
    let subscriptions = [];
    import_vscode4.workspace.onDidChangeTextDocument(this._onEvent, this, subscriptions);
    this._disposable = import_vscode4.Disposable.from(...subscriptions);
  }
  _onEvent({ contentChanges, document }) {
    if (!contentChanges.find((change) => change.text.match(/[\n=EXTERNAL]/i))) return;
    const { fsPath } = document.uri;
    functionMaps[fsPath] = FunctionMap.fromDocument(document);
  }
  dispose() {
    this._disposable.dispose();
  }
};
function generateFunctionMaps() {
  return Promise.all([
    import_vscode4.workspace.findFiles("*.ink"),
    import_vscode4.workspace.findFiles("**/*.ink")
  ]).then(([rootFiles, subFiles]) => {
    const allFiles = [...rootFiles, ...subFiles];
    const uniqueFiles = Array.from(new Map(allFiles.map((f) => [f.fsPath, f])).values());
    return Promise.all(uniqueFiles.map(({ fsPath }) => FunctionMap.from(fsPath)));
  }).then((maps) => {
    maps.forEach((map) => {
      functionMaps[map.filePath] = map;
    });
    functionMapsDone = true;
  }).catch((err) => {
    console.error("Error generating function maps:", err);
  });
}
function getFunctionDefinitionByName(name, filePath) {
  const localMap = functionMaps[filePath];
  if (localMap) {
    const found = localMap.functions.find((f) => f.name === name);
    if (found) return found;
  }
  for (const key in functionMaps) {
    const map = functionMaps[key];
    const found = map.functions.find((f) => f.name === name);
    if (found) return found;
  }
  return null;
}
function getVariableDefinitionByName(name, filePath) {
  const localMap = functionMaps[filePath];
  if (localMap) {
    const found = localMap.variables.find((v) => v.name === name);
    if (found) return found;
  }
  for (const key in functionMaps) {
    const map = functionMaps[key];
    const found = map.variables.find((v) => v.name === name);
    if (found) return found;
  }
  return null;
}

// src/InkFunctionDefinitionProvider.ts
var InkFunctionDefinitionProvider = class {
  provideDefinition(document, position) {
    const line = document.lineAt(position.line).text.trim();
    console.log("Line: ", line);
    if (!line.startsWith("~")) return;
    const match = line.match(/\b([\w]+)\s*/);
    if (!match) return;
    const functionName = match[1];
    const result = getFunctionDefinitionByName(functionName, document.uri.fsPath);
    if (!result) return;
    return new import_vscode5.Location(import_vscode5.Uri.file(result.filePath), new import_vscode5.Position(result.line, 0));
  }
};

// src/WordCount.ts
var import_vscode6 = require("vscode");
var WordAndNodeCounter = class _WordAndNodeCounter {
  plural(n, word) {
    return `${n} ${n === 1 ? word : `${word}s`}`;
  }
  updateWordCount() {
    if (!this._statusBarItem)
      this._statusBarItem = import_vscode6.window.createStatusBarItem(import_vscode6.StatusBarAlignment.Left);
    let editor = import_vscode6.window.activeTextEditor;
    if (!editor) {
      this._statusBarItem.hide();
      return;
    }
    let doc = editor.document;
    if (doc.languageId === "ink") {
      const docContent = doc.getText();
      const wordCount = this._getWordCount(docContent);
      const nodeCount = this._getNodeCount(docContent);
      this._statusBarItem.text = `$(pencil) ${this.plural(wordCount, "Word")} in ${this.plural(nodeCount, "Node")}`;
      this._statusBarItem.show();
    } else {
      this._statusBarItem.hide();
    }
  }
  static lineReducer(stack, line) {
    let { scope, lines } = stack;
    if (line.match(/^\s*$/)) return stack;
    if (scope === "multiline") {
      if (line.match(/\}/) !== null) {
        scope = "root";
        return _WordAndNodeCounter.lineReducer({ scope, lines }, line.match(/}(.*)/)[1]);
      }
      return stack;
    }
    if (scope === "comment") {
      if (line.match(/\*\//) !== null) {
        scope = "root";
        return _WordAndNodeCounter.lineReducer({ scope, lines }, line.match(/\*\/(.*)/)[1]);
      }
      return stack;
    }
    if (line.match(/\{/) !== null) {
      if (line.match(/\}/) !== null)
        return _WordAndNodeCounter.lineReducer(stack, line.replace(/\{.*\}/, ""));
      scope = "multiline";
      return { scope, lines };
    }
    if (line.match(/\/\//) !== null) {
      return _WordAndNodeCounter.lineReducer(stack, line.replace(/\/\/.*/, ""));
    }
    if (line.match(/\/\*/)) {
      if (line.match(/\*\//)) {
        return _WordAndNodeCounter.lineReducer(stack, line.replace(/\/\*.*\*\//, ""));
      }
      scope = "comment";
      return { scope, lines };
    }
    if (line.match(/^\s*(~|=|VAR|EXTERNAL|INCLUDE)/) === null) {
      lines.push(line);
    }
    return { scope, lines };
  }
  _getWordCount(docContent) {
    return docContent.split("\n").reduce(_WordAndNodeCounter.lineReducer, { scope: "root", lines: [] }).lines.join(" ").split(/\s/).filter((word) => word.match(/\w/)).length;
  }
  _getNodeCount(docContent) {
    return docContent.split("\n").filter((line) => line.match(/^\s*=/)).length;
  }
  dispose() {
    this._statusBarItem.dispose();
  }
};
var WordNodeCounterController = class {
  constructor(wordCounter) {
    this._wordCounter = wordCounter;
    this._wordCounter.updateWordCount();
    let subscriptions = [];
    import_vscode6.window.onDidChangeTextEditorSelection(this._onEvent, this, subscriptions);
    import_vscode6.window.onDidChangeActiveTextEditor(this._onEvent, this, subscriptions);
    this._disposable = import_vscode6.Disposable.from(...subscriptions);
  }
  _onEvent() {
    this._wordCounter.updateWordCount();
  }
  dispose() {
    this._disposable.dispose();
  }
};

// src/Completion.ts
var import_vscode7 = require("vscode");
var DivertCompletionProvider = class {
  provideCompletionItems(document, position) {
    const before = document.getText(new import_vscode7.Range(position.with(position.line, 0), position));
    if (!/(->|<-) ?$/.test(before)) return;
    if (/-> ?-> ?$/.test(before)) return;
    return getDivertCompletionTargets(document.uri.fsPath, position.line);
  }
};

// src/InkVariableDefinitionProvider.ts
var import_vscode8 = require("vscode");
var InkVariableDefinitionProvider = class {
  provideDefinition(document, position) {
    const wordRange = document.getWordRangeAtPosition(position);
    if (!wordRange) return;
    const variableName = document.getText(wordRange);
    if (!variableName) return;
    const result = getVariableDefinitionByName(variableName, document.uri.fsPath);
    if (!result) return;
    return new import_vscode8.Location(import_vscode8.Uri.file(result.filePath), new import_vscode8.Position(result.line, 0));
  }
};

// src/extension.ts
var INK = { language: "ink" };
function activate(ctx) {
  const wordCounter = new WordAndNodeCounter();
  const wcController = new WordNodeCounterController(wordCounter);
  const nodeMapController = new NodeController();
  const functionMapper = new FunctionController();
  import_vscode9.window.withProgress({ location: import_vscode9.ProgressLocation.Window, title: "Mapping knots and stitches..." }, generateMaps);
  import_vscode9.window.withProgress({ location: import_vscode9.ProgressLocation.Window, title: "Mapping function declarations..." }, generateFunctionMaps);
  ctx.subscriptions.push(wcController);
  ctx.subscriptions.push(wordCounter);
  ctx.subscriptions.push(nodeMapController);
  ctx.subscriptions.push(functionMapper);
  ctx.subscriptions.push(import_vscode9.languages.registerCompletionItemProvider(INK, new DivertCompletionProvider(), ">", "-", " "));
  ctx.subscriptions.push(import_vscode9.languages.registerDefinitionProvider(INK, new InkDivertDefinitionProvider()));
  ctx.subscriptions.push(import_vscode9.languages.registerDefinitionProvider(INK, new InkFunctionDefinitionProvider()));
  ctx.subscriptions.push(import_vscode9.languages.registerDefinitionProvider(INK, new InkVariableDefinitionProvider()));
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate
});
//# sourceMappingURL=extension.js.map