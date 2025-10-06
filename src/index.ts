import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ICommandPalette } from '@jupyterlab/apputils';
import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { FloatingChatWidget } from './widget';
import { IFloatingChatOptions } from './tokens';

/**
 * Initialization data for the floating-chat extension.
 */
const plugin: JupyterFrontEndPlugin<IFloatingChatOptions> = {
  id: 'floating-chat:plugin',
  description: 'A JupyterLab extension to add a floating chat.',
  autoStart: true,
  optional: [ISettingRegistry, ICommandPalette],
  provides: IFloatingChatOptions,
  activate: (
    app: JupyterFrontEnd,
    settingRegistry: ISettingRegistry | null,
    palette: ICommandPalette | null
  ): IFloatingChatOptions => {
    console.log('JupyterLab extension floating-chat is activated!');

    const options: IFloatingChatOptions = {};

    let floatingWidget: FloatingChatWidget | null = null;
    let lastContextMenuPosition = { x: 0, y: 0 };

    // Get the right click position.
    document.addEventListener('contextmenu', event => {
      lastContextMenuPosition = { x: event.clientX, y: event.clientY };
    });

    // Command to toggle floating chat
    const command = 'floating-chat:toggle';
    app.commands.addCommand(command, {
      label: 'Floating Chat',
      execute: args => {
        if (floatingWidget && !floatingWidget.isDisposed) {
          floatingWidget.dispose();
          floatingWidget = null;
        } else {
          if (options.chatModel === undefined) {
            return;
          }
          floatingWidget = new FloatingChatWidget({
            ...options,
            chatModel: options.chatModel,
            position: lastContextMenuPosition
          });
          floatingWidget.attach();
        }
      }
    });

    // Add to command palette
    if (palette) {
      palette.addItem({ command, category: 'Chat' });
    }

    // Add to context menu
    app.contextMenu.addItem({
      command,
      selector: '.jp-Notebook',
      rank: 1000,
      args: {
        isNotebook: true
      }
    });

    if (settingRegistry) {
      settingRegistry
        .load(plugin.id)
        .then(settings => {
          console.log('floating-chat settings loaded:', settings.composite);
        })
        .catch(reason => {
          console.error('Failed to load settings for floating-chat.', reason);
        });
    }

    return options;
  }
};

export default plugin;
export { IFloatingChatOptions } from './tokens';
