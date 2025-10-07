import { ChatInput, JlThemeProvider } from '@jupyter/chat';
import { Button } from '@jupyter/react-components';
import { IThemeManager } from '@jupyterlab/apputils';
import { classes, closeIcon, LabIcon } from '@jupyterlab/ui-components';
import React from 'react';

interface IFloatingInputProps extends ChatInput.IProps {
  onClose: () => void;
  updatePosition: () => void;
  /**
   * The theme manager.
   */
  themeManager?: IThemeManager | null;
}

export const FloatingInput: React.FC<IFloatingInputProps> = ({
  model,
  toolbarRegistry,
  onClose,
  onCancel,
  updatePosition,
  themeManager
}) => {
  const inputRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // Focus on the input when rendered.
    inputRef.current?.getElementsByTagName('textarea').item(0)?.focus();

    // Setup ResizeObserver to detect change in size.
    let resizeObserver: ResizeObserver | null = null;

    if (containerRef.current) {
      resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          console.log('Resize detected:', entry.contentRect);
          updatePosition();
        }
      });

      resizeObserver.observe(containerRef.current);
    }

    // Update the position after the first render.
    updatePosition();

    // Cleanup
    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  return (
    <JlThemeProvider themeManager={themeManager ?? null}>
      <div ref={containerRef} className="floating-input-container">
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
    </JlThemeProvider>
  );
};
