import {
  Chat,
  ChatWidget,
  IChatCommandRegistry,
  IChatTracker,
  IInputToolbarRegistry
} from '@jupyter/chat';
import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { FloatingInputWidget } from './widget';

export namespace CommandIds {
  /**
   * The command to open a floating input.
   */
  export const openInput = 'jupyter-floating-chat:open-input';
}

/**
 * Initialization data for the jupyter-floating-chat extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyter-floating-chat:plugin',
  description: 'A JupyterLab extension to add a floating chat.',
  autoStart: true,
  optional: [
    IChatTracker,
    IRenderMimeRegistry,
    ISettingRegistry,
    INotebookTracker,
    IChatCommandRegistry
  ],
  activate: (
    app: JupyterFrontEnd,
    chatTracker: IChatTracker | null,
    rmRegistry: IRenderMimeRegistry | null,
    settingRegistry: ISettingRegistry | null,
    notebookTracker: INotebookTracker,
    chatCommandRegistry: IChatCommandRegistry
  ): void => {
    console.log('JupyterLab extension jupyter-floating-chat is activated!');

    if (!chatTracker || !rmRegistry) {
      return;
    }

    let floatingWidget: FloatingInputWidget | null = null;
    let lastContextMenuPosition = { x: 0, y: 0 };
    let lastContextMenuTarget: HTMLElement | null = null;

    // Get the right click position.
    document.addEventListener('contextmenu', event => {
      lastContextMenuPosition = { x: event.clientX, y: event.clientY };
      lastContextMenuTarget = event.target as HTMLElement;
    });

    // Add the command to open the floating input.
    app.commands.addCommand(CommandIds.openInput, {
      label: args => {
        return `Chat (${args.targetType})`;
      },
      isVisible: () => !!chatTracker.currentWidget,
      execute: args => {
        if (floatingWidget && !floatingWidget.isDisposed) {
          floatingWidget.dispose();
          floatingWidget = null;
        } else {
          if (!chatTracker.currentWidget) {
            return;
          }
          const widget = chatTracker.currentWidget;

          let inputToolbarRegistry: IInputToolbarRegistry | undefined;
          if (widget instanceof ChatWidget) {
            inputToolbarRegistry = widget.inputToolbarRegistry;
          } else {
            inputToolbarRegistry = widget.content.inputToolbarRegistry;
          }

          const chatContext: Chat.IChatProps = {
            model: widget.model,
            rmRegistry: rmRegistry,
            chatCommandRegistry,
            inputToolbarRegistry,
            area: 'sidebar'
          };
          floatingWidget = new FloatingInputWidget({
            chatContext,
            notebookTracker,
            position: lastContextMenuPosition,
            target: lastContextMenuTarget,
            targetType: args.targetType as string
          });
          floatingWidget.attach();
        }
      }
    });

    // Add to context menu
    app.contextMenu.addItem({
      command: CommandIds.openInput,
      selector: '.jp-Notebook',
      rank: 0,
      args: {
        targetType: 'Notebook'
      }
    });

    app.contextMenu.addItem({
      command: CommandIds.openInput,
      selector: '.jp-Cell',
      rank: 0,
      args: {
        targetType: 'Cell'
      }
    });

    if (settingRegistry) {
      settingRegistry
        .load(plugin.id)
        .then(settings => {
          console.log(
            'jupyter-floating-chat settings loaded:',
            settings.composite
          );
        })
        .catch(reason => {
          console.error(
            'Failed to load settings for jupyter-floating-chat.',
            reason
          );
        });
    }
  }
};

export default plugin;
