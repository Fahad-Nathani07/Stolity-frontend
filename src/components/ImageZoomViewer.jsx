import React, { useCallback, useEffect, useRef, useState } from "react";

const STAGE_PADDING = 16;
const DRAG_THRESHOLD = 3;

const fitImageInBox = (naturalWidth, naturalHeight, maxWidth, maxHeight) => {
  if (!naturalWidth || !naturalHeight) {
    return { width: 0, height: 0 };
  }

  const aspect = naturalWidth / naturalHeight;
  let width = maxWidth;
  let height = width / aspect;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspect;
  }

  return {
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
  };
};

const ImageZoomViewer = ({ src, zoom = 1, onClick }) => {
  const outerRef = useRef(null);
  const viewportRef = useRef(null);
  const imgRef = useRef(null);
  const prevZoomRef = useRef(zoom);
  const baseSizeRef = useRef({ width: 0, height: 0 });
  const dragRef = useRef({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });
  const [baseSize, setBaseSize] = useState({ width: 0, height: 0 });
  const [canPan, setCanPan] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const measureBaseSize = useCallback(() => {
    const outer = outerRef.current;
    const img = imgRef.current;
    if (!outer || !img?.naturalWidth) return;

    // Measure from the outer shell so scrollbar appearance does not shrink the fit box.
    const maxWidth = Math.max(80, outer.clientWidth - STAGE_PADDING * 2);
    const maxHeight = Math.max(80, outer.clientHeight - STAGE_PADDING * 2);
    const next = fitImageInBox(
      img.naturalWidth,
      img.naturalHeight,
      maxWidth,
      maxHeight
    );

    const prev = baseSizeRef.current;
    if (prev.width === next.width && prev.height === next.height) return;

    baseSizeRef.current = next;
    setBaseSize(next);
  }, []);

  const updateCanPan = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    setCanPan(
      viewport.scrollWidth > viewport.clientWidth + 1 ||
        viewport.scrollHeight > viewport.clientHeight + 1
    );
  }, []);

  useEffect(() => {
    prevZoomRef.current = zoom;
    baseSizeRef.current = { width: 0, height: 0 };
    setBaseSize({ width: 0, height: 0 });
    setCanPan(false);

    const viewport = viewportRef.current;
    if (viewport) {
      viewport.scrollLeft = 0;
      viewport.scrollTop = 0;
    }
  }, [src]);

  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return undefined;

    const observer = new ResizeObserver(() => {
      measureBaseSize();
      updateCanPan();
    });
    observer.observe(outer);
    return () => observer.disconnect();
  }, [measureBaseSize, updateCanPan, src]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !baseSizeRef.current.width || !baseSizeRef.current.height) {
      return;
    }

    const prevZoom = prevZoomRef.current;
    if (prevZoom === zoom) return;

    const viewWidth = viewport.clientWidth;
    const viewHeight = viewport.clientHeight;
    const maxScrollLeft = Math.max(0, viewport.scrollWidth - viewWidth);
    const maxScrollTop = Math.max(0, viewport.scrollHeight - viewHeight);
    const ratioX =
      maxScrollLeft > 0 ? viewport.scrollLeft / maxScrollLeft : 0.5;
    const ratioY =
      maxScrollTop > 0 ? viewport.scrollTop / maxScrollTop : 0.5;

    prevZoomRef.current = zoom;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const nextMaxLeft = Math.max(0, viewport.scrollWidth - viewWidth);
        const nextMaxTop = Math.max(0, viewport.scrollHeight - viewHeight);
        viewport.scrollLeft = nextMaxLeft > 0 ? ratioX * nextMaxLeft : 0;
        viewport.scrollTop = nextMaxTop > 0 ? ratioY * nextMaxTop : 0;
        updateCanPan();
      });
    });
  }, [zoom, updateCanPan]);

  useEffect(() => {
    requestAnimationFrame(updateCanPan);
  }, [baseSize, zoom, updateCanPan]);

  const endDrag = useCallback(() => {
    dragRef.current.active = false;
    setIsDragging(false);
  }, []);

  const handlePointerDown = useCallback(
    (e) => {
      if (!canPan || e.button !== 0) return;

      const viewport = viewportRef.current;
      if (!viewport) return;

      dragRef.current = {
        active: true,
        moved: false,
        startX: e.clientX,
        startY: e.clientY,
        scrollLeft: viewport.scrollLeft,
        scrollTop: viewport.scrollTop,
      };
      setIsDragging(true);
      viewport.setPointerCapture(e.pointerId);
    },
    [canPan]
  );

  const handlePointerMove = useCallback((e) => {
    if (!dragRef.current.active) return;

    const viewport = viewportRef.current;
    if (!viewport) return;

    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    if (
      !dragRef.current.moved &&
      (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)
    ) {
      dragRef.current.moved = true;
    }

    viewport.scrollLeft = dragRef.current.scrollLeft - dx;
    viewport.scrollTop = dragRef.current.scrollTop - dy;
  }, []);

  const handlePointerUp = useCallback(
    (e) => {
      if (!dragRef.current.active) return;

      const viewport = viewportRef.current;
      if (viewport?.hasPointerCapture(e.pointerId)) {
        viewport.releasePointerCapture(e.pointerId);
      }
      endDrag();
    },
    [endDrag]
  );

  const handleClick = useCallback(
    (e) => {
      if (dragRef.current.moved) {
        e.preventDefault();
        e.stopPropagation();
        dragRef.current.moved = false;
        return;
      }
      onClick?.(e);
    },
    [onClick]
  );

  const handleImageLoad = useCallback(() => {
    measureBaseSize();
    requestAnimationFrame(updateCanPan);
  }, [measureBaseSize, updateCanPan]);

  const canvasWidth = Math.round(baseSize.width * zoom);
  const canvasHeight = Math.round(baseSize.height * zoom);

  return (
    <div ref={outerRef} className="cfm-image-outer">
      <div
        ref={viewportRef}
        className={`cfm-image-viewport${
          canPan ? " cfm-image-viewport--pannable" : ""
        }${isDragging ? " cfm-image-viewport--dragging" : ""}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleClick}
      >
        <div
          className="cfm-image-stage"
          style={{
            "--cfm-canvas-w": `${canvasWidth}px`,
            "--cfm-canvas-h": `${canvasHeight}px`,
          }}
        >
          <div className="cfm-image-canvas">
            <img
              ref={imgRef}
              src={src}
              alt="Preview"
              className="cfm-image"
              draggable={false}
              decoding="async"
              fetchPriority="high"
              onLoad={handleImageLoad}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageZoomViewer;
