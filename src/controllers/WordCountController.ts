import { Disposable, window } from "vscode";
import { WordCounterService } from "./WordCounterService";

export class WordNodeCounterController 
{
    private _disposable: Disposable;

    constructor (private readonly wordCounter: WordCounterService) 
    {
        this.wordCounter.updateWordCount();

        const subscriptions: Disposable[] = [
            window.onDidChangeTextEditorSelection(this._onEvent, this),
            window.onDidChangeActiveTextEditor(this._onEvent, this)
        ];

        this._disposable = Disposable.from(...subscriptions);
    }

    private _onEvent() 
    {
        this.wordCounter.updateWordCount();
    }

    public dispose() 
    {
        this._disposable.dispose();
    }
}