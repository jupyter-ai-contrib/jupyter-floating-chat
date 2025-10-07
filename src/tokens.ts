import { IChatModel, IInputToolbarRegistry } from '@jupyter/chat';
import { Token } from '@lumino/coreutils';

export namespace CommandIds {
  /**
   * The command to open a floating input.
   */
  export const openInput = 'jupyter-floating-chat:open-input';
}

/**
 * The floating chat options.
 */
export interface IFloatingInputOptions {
  chatModel?: IChatModel;
  toolbarRegistry?: IInputToolbarRegistry;
}

/**
 * The token providing the floating chat options.
 */
export const IFloatingInputOptions = new Token<IFloatingInputOptions>(
  'jupyter-floating-chat:options',
  'The default options for the floating chat.'
);
