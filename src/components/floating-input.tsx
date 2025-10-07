import { ChatInput } from '@jupyter/chat';
import { Button } from '@jupyter/react-components';
import { classes, closeIcon, LabIcon } from '@jupyterlab/ui-components';
import React from 'react';

interface IFloatingInputProps extends ChatInput.IProps {
  onClose: () => void;
}

export const FloatingInput: React.FC<IFloatingInputProps> = ({
  model,
  toolbarRegistry,
  onClose,
  onCancel
}) => {
  const inputRef = React.useRef<HTMLDivElement>(null);

  // Focus on the input when rendered.
  React.useEffect(() => {
    inputRef.current?.getElementsByTagName('textarea').item(0)?.focus();
  }, []);

  return (
    <div className="floating-input-container">
      <div className="floating-input-header">
        <div className="floating-input-title">💬 Chat</div>
        <Button className="floating-input-close" onClick={onClose}>
          <LabIcon.resolveReact
            display={'flex'}
            icon={closeIcon}
            iconClass={classes('jp-Icon')}
          />
        </Button>
      </div>
      <div ref={inputRef} className="floating-input-body">
        <ChatInput
          model={model}
          toolbarRegistry={toolbarRegistry}
          onCancel={onCancel}
        />
      </div>
    </div>
  );
};
