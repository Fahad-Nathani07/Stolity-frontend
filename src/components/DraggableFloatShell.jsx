import React, { useRef } from "react";
import Draggable from "react-draggable";
import "./DraggableFloatShell.css";

/**
 * Floating panel shell: stays out of document flow (fixed via panel class),
 * drag only from the 4 edge strips.
 */
const DraggableFloatShell = ({
  children,
  className = "",
  style,
  defaultPosition = { x: 0, y: 0 },
}) => {
  const nodeRef = useRef(null);

  return (
    <Draggable
      nodeRef={nodeRef}
      handle=".float-drag-edge"
      // Avoid bounds="body" — it can expand the page / shift layout while dragging
      bounds={false}
      defaultPosition={defaultPosition}
      cancel="button, a, input, textarea, select, .tp-toggle-btn, .tp-window-btn, .tp-mini, .audio-close-btn"
    >
      <div
        ref={nodeRef}
        className={`float-shell ${className}`.trim()}
        style={style}
      >
        <div className="float-drag-edge float-drag-edge--top" title="Drag" aria-hidden="true" />
        <div className="float-drag-edge float-drag-edge--right" title="Drag" aria-hidden="true" />
        <div className="float-drag-edge float-drag-edge--bottom" title="Drag" aria-hidden="true" />
        <div className="float-drag-edge float-drag-edge--left" title="Drag" aria-hidden="true" />
        <div className="float-shell-body">{children}</div>
      </div>
    </Draggable>
  );
};

export default DraggableFloatShell;
