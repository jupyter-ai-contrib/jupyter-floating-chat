import React from 'react';
import { ChatInput } from '@jupyter/chat';
// import { Widget } from '@lumino/widgets';

interface IFloatingChatProps extends ChatInput.IProps {
  onClose: () => void;
}

export const FloatingChat: React.FC<IFloatingChatProps> = ({
  model,
  toolbarRegistry,
  onClose,
  onCancel
}) => {
  return (
    <div className="floating-chat-container">
      <div className="floating-chat-header">
        <div
          className="floating-chat-drag-handle"
          // onMouseDown={onMouseDown}
          style={{ userSelect: 'none' }}
        >
          💬 Floating Chat
        </div>
        <button className="floating-chat-close" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="floating-chat-body">
        <ChatInput
          model={model}
          toolbarRegistry={toolbarRegistry}
          onCancel={onCancel}
        />
      </div>
    </div>
  );
};
