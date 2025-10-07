import {
  IChatModel,
  IInputToolbarRegistry,
  INotebookAttachment,
  InputToolbarRegistry
} from '@jupyter/chat';
import { ReactWidget } from '@jupyterlab/apputils';
import { Cell } from '@jupyterlab/cells';
import { INotebookTracker } from '@jupyterlab/notebook';
import { Message } from '@lumino/messaging';
import { Widget } from '@lumino/widgets';
import React from 'react';

import { FloatingInput } from './components/floating-input';
import { IFloatingInputOptions } from './tokens';

export namespace FloatingInputWidget {
  export interface IOptions extends IFloatingInputOptions {
    chatModel: IChatModel;
    notebookTracker: INotebookTracker;
    position?: { x: number; y: number };
    target: HTMLElement | null;
    targetType?: string;
  }
}

export class FloatingInputWidget extends ReactWidget {
  constructor(options: FloatingInputWidget.IOptions) {
    super();
    this._chatModel = options.chatModel;
    this._toolbarRegistry =
      options.toolbarRegistry ?? InputToolbarRegistry.defaultToolbarRegistry();
    this._toolbarRegistry.hide('attach');
    this._position = options.position;

    // Keep the original send function to restore it on dispose.
    this._originalSend = this._chatModel.input.send;
    this._chatModel.input.send = (content: string) => {
      this._originalSend.call(this, content);
      this.dispose();
    };

    if (options.targetType && options.target) {
      const notebookPanel = options.notebookTracker.currentWidget;
      if (!notebookPanel) {
        return;
      }
      const attachment: INotebookAttachment = {
        type: 'notebook',
        value: notebookPanel.context.path
      };

      let cell: Cell;
      if (options.targetType === 'Cell') {
        const cellElement = options.target.closest('.jp-Cell') as HTMLElement;
        if (
          cellElement &&
          cellElement.dataset.windowedListIndex !== undefined
        ) {
          cell =
            notebookPanel.content.widgets[
              +cellElement.dataset.windowedListIndex
            ];

          const cellType = cell.model.type as 'code' | 'markdown' | 'raw';
          attachment.cells = [
            {
              input_type: cellType,
              id: cell.id
            }
          ];
        }
      }
      this._chatModel.input.addAttachment?.(attachment);
    }

    this.addClass('floating-input-widget');
    this.id = 'floating-input-widget';
  }

  protected render(): JSX.Element {
    return (
      <FloatingInput
        model={this._chatModel.input}
        toolbarRegistry={this._toolbarRegistry}
        onClose={() => this.dispose()}
      />
    );
  }

  attach(): void {
    Widget.attach(this, document.body);
  }

  detach(): void {
    Widget.detach(this);
  }

  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);

    this.node.style.position = 'fixed';
    this.node.style.zIndex = '1000';

    if (this._position) {
      let { x, y } = this._position;

      // Adjust widget position
      const rect = this.node.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width;
      const maxY = window.innerHeight - rect.height;

      x = Math.max(0, Math.min(x, maxX));
      y = Math.max(0, Math.min(y, maxY));

      this.node.style.left = `${x}px`;
      this.node.style.top = `${y}px`;
    } else {
      this.node.style.right = '20px';
      this.node.style.bottom = '20px';
    }
    document.addEventListener('click', this._onDocumentClick.bind(this));
  }

  private _onDocumentClick(event: Event): void {
    if (!this.node.contains(event.target as Node)) {
      this.dispose();
    }
  }

  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    // remove the event listener.
    document.removeEventListener('click', this._onDocumentClick.bind(this));

    // Clean the chat input.
    this._chatModel.input.value = '';
    this._chatModel.input.clearAttachments();

    // Restore the original send function.
    this._chatModel.input.send = this._originalSend;
    super.dispose();
  }

  private _chatModel: IChatModel;
  private _toolbarRegistry: IInputToolbarRegistry;
  private _position?: { x: number; y: number };
  private _originalSend: (content: string) => void;
}
