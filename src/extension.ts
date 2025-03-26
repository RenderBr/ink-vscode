'use strict';
/* Ink for VS Code Extension Main File */

import { ExtensionContext, DocumentFilter, ProgressLocation, languages, window } from "vscode";
import { InkDivertDefinitionProvider } from "./providers/InkDivertDefinitionProvider";
import { InkFunctionDefinitionProvider } from "./providers/InkFunctionDefinitionProvider";
import { DivertCompletionProvider } from "./providers/DivertCompletionProvider";
import { InkVariableDefinitionProvider } from "./providers/InkVariableDefinitionProvider";
import { generateNodeMaps, NodeController } from "./controllers/NodeController";
import { FunctionController, generateFunctionMaps } from "./controllers/FunctionController";
import { WordNodeCounterController } from "./controllers/WordCountController";
import { WordCounterService } from "./controllers/WordCounterService";

const INK : DocumentFilter = { language: 'ink' };

export function activate(context: ExtensionContext) {
    const disposables = [];

    // Services and controllers.
    const wordCounter = new WordCounterService();
    const wordCounterController = new WordNodeCounterController(wordCounter);
    const nodeController = new NodeController();
    const functionController = new FunctionController();

    // Add to a list of disposables to be disposed when this extension is deactivated.
    disposables.push(wordCounter, wordCounterController, nodeController, functionController);

    // Show mapping progress, runs in parallel.
    (async () => {
        try {
          await Promise.all([
            window.withProgress({ location: ProgressLocation.Window, title: "Mapping knots and stitches..." }, generateNodeMaps),
            window.withProgress({ location: ProgressLocation.Window, title: "Mapping function declarations..." }, generateFunctionMaps)
          ]);
        } catch (err) {
          console.error("Error while mapping:", err);
        }
    })();
    
    // Register language features and push to disposables.
    disposables.push(
        languages.registerCompletionItemProvider(INK, new DivertCompletionProvider(), '>', '-', ' '),
        languages.registerDefinitionProvider(INK, new InkDivertDefinitionProvider()),
        languages.registerDefinitionProvider(INK, new InkFunctionDefinitionProvider()),
        languages.registerDefinitionProvider(INK, new InkVariableDefinitionProvider())
    );

    // Register everything for disposal.
    context.subscriptions.push(...disposables);
}