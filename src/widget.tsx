import {
  IChatModel,
  IInputToolbarRegistry,
  INotebookAttachment,
  InputToolbarRegistry
} from '@jupyter/chat';
import { IThemeManager, ReactWidget } from '@jupyterlab/apputils';
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
    themeManager?: IThemeManager;
  }
}

export class FloatingInputWidget extends ReactWidget {
  constructor(options: FloatingInputWidget.IOptions) {
    super();
    this._chatModel = options.chatModel;
    this._toolbarRegistry =
      options.toolbarRegistry ?? InputToolbarRegistry.defaultToolbarRegistry();
    this._toolbarRegistry.hide('attach');
    this._position = options.position ? { ...options.position } : undefined;
    this._themeManager = options.themeManager;

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
    this.addClass('jp-ThemedContainer');
    this.id = 'floating-input-widget';
  }

  protected render(): JSX.Element {
    return (
      <FloatingInput
        model={this._chatModel.input}
        toolbarRegistry={this._toolbarRegistry}
        onClose={() => this.dispose()}
        updatePosition={this.updatePosition}
        onDrag={this.handleDrag}
        themeManager={this._themeManager}
      />
    );
  }

  attach(): void {
    Widget.attach(this, document.body);
  }

  detach(): void {
    Widget.detach(this);
  }

  handleDrag = (
    deltaX: number,
    deltaY: number,
    isStart = false,
    isEnd = false
  ) => {
    // Clean the start position on drop.
    if (isEnd) {
      this._dragStartPosition = undefined;
      return;
    }

    // Get the widget position on drag start.
    if (isStart || !this._dragStartPosition) {
      const rect = this.node.getBoundingClientRect();
      this._dragStartPosition = { x: rect.left, y: rect.top };
      return; // Do not apply move at init.
    }

    const newX = this._dragStartPosition.x + deltaX;
    const newY = this._dragStartPosition.y + deltaY;

    // Constrain the widget position to the window.
    const rect = this.node.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width;
    const maxY = window.innerHeight - rect.height;

    const constrainedX = Math.max(0, Math.min(newX, maxX));
    const constrainedY = Math.max(0, Math.min(newY, maxY));

    this._position = { x: constrainedX, y: constrainedY };

    this.node.style.left = `${constrainedX}px`;
    this.node.style.top = `${constrainedY}px`;
  };

  updatePosition = () => {
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
  };

  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);

    this.node.style.position = 'fixed';
    this.node.style.zIndex = '1000';

    this.updatePosition();
    document.addEventListener('click', this._onDocumentClick.bind(this));
  }

  private _onDocumentClick(event: Event): void {
    if (this.isDisposed) {
      return;
    }

    const target = event.target as HTMLElement;

    // Check if the target is still in the DOM.
    if (!document.contains(target)) {
      return;
    }

    // Check if it's a MUI Portal element (Popper, Menu, etc.), which can be attached
    // to the body and not to the widget (for example the title of a button).
    const isMuiPortal =
      target.closest('[data-mui-portal]') !== null ||
      target.closest('.MuiPopper-root') !== null ||
      target.closest('.MuiPopover-root') !== null ||
      target.closest('.MuiTooltip-popper') !== null ||
      target.closest('.MuiDialog-root') !== null ||
      target.closest('[role="presentation"]') !== null;

    if (isMuiPortal) {
      return;
    }

    if (!this.node.contains(target)) {
      this.dispose();
    }
  }

  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    // Remove the event listener.
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
  private _themeManager?: IThemeManager;
  private _dragStartPosition?: { x: number; y: number };
}
