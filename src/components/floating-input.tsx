import { ChatInput, JlThemeProvider } from '@jupyter/chat';
import { Button } from '@jupyter/react-components';
import { IThemeManager } from '@jupyterlab/apputils';
import { classes, closeIcon, LabIcon } from '@jupyterlab/ui-components';
import React from 'react';

interface IFloatingInputProps extends ChatInput.IProps {
  onClose: () => void;
  updatePosition: () => void;
  onDrag?: (
    deltaX: number,
    deltaY: number,
    isStart?: boolean,
    isEnd?: boolean
  ) => void;
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
  onDrag,
  themeManager
}) => {
  const inputRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  React.useEffect(() => {
    // Focus on the input when rendered.
    inputRef.current?.getElementsByTagName('textarea').item(0)?.focus();

    // Setup ResizeObserver to detect change in size.
    let resizeObserver: ResizeObserver | null = null;

    if (containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (!isDragging) {
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
  }, [updatePosition, isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start dragging if clicking on the header (not the close button)
    if ((e.target as HTMLElement).closest('.floating-input-close')) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);

    // Signaler le début du drag
    onDrag?.(0, 0, true);

    const startX = e.clientX;
    const startY = e.clientY;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      // Call the drag handler from parent
      onDrag?.(deltaX, deltaY, false);
    };

    const handleMouseUp = () => {
      setIsDragging(false);

      // Signaler la fin du drag pour nettoyer l'état
      onDrag?.(0, 0, false, true); // Quatrième paramètre pour indiquer la fin

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <JlThemeProvider themeManager={themeManager ?? null}>
      <div
        ref={containerRef}
        className={`floating-input-container ${isDragging ? 'dragging' : ''}`}
      >
        <div
          className="floating-input-header"
          onMouseDown={handleMouseDown}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
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
