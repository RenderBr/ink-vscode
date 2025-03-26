'use strict';
/* Ink for VS Code Extension Main File */

import { ExtensionContext, DocumentFilter, ProgressLocation, languages, window } from "vscode";
import { InkDivertDefinitionProvider } from "./InkDivertDefinitionProvider";
import { generateMaps, NodeController } from "./models/NodeController";
import { InkFunctionDefinitionProvider } from "./InkFunctionDefinitionProvider";
import { WordAndNodeCounter, WordNodeCounterController } from "./WordCount";
import { DivertCompletionProvider } from "./Completion";
import { FunctionMap } from "./models/FunctionMap";
import { FunctionController, generateFunctionMaps } from "./models/FunctionController";
import { InkVariableDefinitionProvider } from "./InkVariableDefinitionProvider";

const INK : DocumentFilter = { language: 'ink' };

export function activate(ctx: ExtensionContext) {

    // Create a new word counter.s
    const wordCounter = new WordAndNodeCounter();
    const wcController = new WordNodeCounterController(wordCounter);
    const nodeMapController = new NodeController();
    const functionMapper = new FunctionController();

    // Start generating a node map.
    window.withProgress({ location: ProgressLocation.Window, title: "Mapping knots and stitches..." }, generateMaps);
    window.withProgress({location: ProgressLocation.Window, title: "Mapping function declarations..." }, generateFunctionMaps);
    
    // Add to a list of disposables which are disposed when this extension is
    // deactivated again.
    ctx.subscriptions.push(wcController);
    ctx.subscriptions.push(wordCounter);
    ctx.subscriptions.push(nodeMapController);
    ctx.subscriptions.push(functionMapper);

    // Enable the completion provider.
    ctx.subscriptions.push(languages.registerCompletionItemProvider(INK, new DivertCompletionProvider(), '>', '-', ' '));

    // Enable the definition provider.
    ctx.subscriptions.push(languages.registerDefinitionProvider(INK, new InkDivertDefinitionProvider()));
    ctx.subscriptions.push(languages.registerDefinitionProvider(INK, new InkFunctionDefinitionProvider()));
    ctx.subscriptions.push(languages.registerDefinitionProvider(INK, new InkVariableDefinitionProvider()));
}