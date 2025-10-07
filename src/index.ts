import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { FloatingInputWidget } from './widget';
import { CommandIds, IFloatingInputOptions } from './tokens';

/**
 * Initialization data for the jupyter-floating-chat extension.
 */
const plugin: JupyterFrontEndPlugin<IFloatingInputOptions> = {
  id: 'jupyter-floating-chat:plugin',
  description: 'A JupyterLab extension to add a floating chat.',
  autoStart: true,
  optional: [ISettingRegistry, INotebookTracker],
  provides: IFloatingInputOptions,
  activate: (
    app: JupyterFrontEnd,
    settingRegistry: ISettingRegistry | null,
    notebookTracker: INotebookTracker
  ): IFloatingInputOptions => {
    console.log('JupyterLab extension jupyter-floating-chat is activated!');

    const options: IFloatingInputOptions = {};

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
      isVisible: () => !!options.chatModel,
      execute: args => {
        if (floatingWidget && !floatingWidget.isDisposed) {
          floatingWidget.dispose();
          floatingWidget = null;
        } else {
          if (options.chatModel === undefined) {
            return;
          }
          floatingWidget = new FloatingInputWidget({
            ...options,
            chatModel: options.chatModel,
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

    return options;
  }
};

export default plugin;
export { IFloatingInputOptions as IFloatingChatOptions } from './tokens';
