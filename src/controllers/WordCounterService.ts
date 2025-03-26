'use strict';

import { window, StatusBarAlignment, StatusBarItem } from "vscode";

/* Provides word count functionality. Mostly adapted from the example
    word counter extension.
*/
export class WordCounterService {
    private _statusBarItem: StatusBarItem | undefined;

    private plural (n: number, word: string) : string 
    {
        return `${n} ${word}${n === 1 ? '' : 's'}`;
    }

    public updateWordCount() 
    {
        // If the editor is not active, hide the status bar item.
        const editor = window.activeTextEditor;
        if (!editor) 
        {
            this._statusBarItem.hide();
            return;
        }

        // If the document is not an Ink document, hide the status bar item.
        const doc = editor.document;
        if (doc.languageId !== "ink") 
        {
            this._statusBarItem.hide();
            return;
        }

        // Since the status bar item is not yet created, create it, since we are in an Ink document.
        if (!this._statusBarItem)
        {
            this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
        }

        const docContent = doc.getText();
        const wordCount = this._getWordCount(docContent);
        const nodeCount = this._getNodeCount(docContent);

        // Update the status bar, finally.
        this._statusBarItem.text = `$(pencil) ${this.plural(wordCount, "word")} in ${this.plural(nodeCount, "node")}`;
        this._statusBarItem.show();
    }

    private _getWordCount(content: string): number 
    {
        const lines = content.split("\n");
      
        const cleaned = this._stripMultilineBlocks(lines)
        .map(line => this._stripCommentsAndBlocks(line))
        .filter(line => this._isNarrativeLine(line));
      
        const text = cleaned.join(" ");
        return text
          .split(/\s+/)
          .filter(word => /\w/.test(word)).length;
    }

    private _stripCommentsAndBlocks(line: string): string 
    {
        // remove single-line comments
        line = line.replace(/\/\/.*$/, "");
      
        // remove inline logic blocks like { some logic }
        line = line.replace(/\{.*?\}/g, "");
      
        // remove inline multi-line comments
        line = line.replace(/\/\*.*?\*\//g, "");
      
        return line.trim();
    }

    private _isNarrativeLine(line: string): boolean 
    {
        if (line.trim().length === 0) return false;
        if (/^\s*(~|=|VAR|EXTERNAL|INCLUDE)/.test(line)) return false;
        return true;
    }

    private _stripMultilineBlocks(lines: string[]): string[] 
    {
        let inBlock = false;
        let inComment = false;
        const result: string[] = [];
      
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

    public _getNodeCount (docContent: string): number 
    {
        return docContent.split("\n").filter(line => line.match(/^\s*=/)).length;
    }

    public dispose() 
    {
        this._statusBarItem.dispose();
    }
}