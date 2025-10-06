import { IChatModel, IInputToolbarRegistry } from '@jupyter/chat';
import { Token } from '@lumino/coreutils';

/**
 * The floating chat options.
 */
export interface IFloatingChatOptions {
  chatModel?: IChatModel;
  toolbarRegistry?: IInputToolbarRegistry;
}

/**
 * The token providing the floating chat options.
 */
export const IFloatingChatOptions = new Token<IFloatingChatOptions>(
  'floating-chat:options',
  'The default options for the floating chat.'
);
