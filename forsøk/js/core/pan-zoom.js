(function () {
  "use strict";

  window.EX_APP = window.EX_APP || {};

  function createPanZoom({
    viewport,
    image,
    minScale = 1,
    maxScale = 5,
    allowSwipeAtMinScale = false,
    onSwipeLeft,
    onSwipeRight,
  }) {
    if (!viewport || !image) {
      return null;
    }

    let scale = 1;
    let x = 0;
    let y = 0;

    let pointerStart = null;
    let pinchStartDistance = 0;
    let pinchStartScale = 1;
    let activePointers = new Map();

    function fit() {
      scale = 1;
      x = 0;
      y = 0;
      apply();
      sizeToViewport();
    }

    function sizeToViewport() {
      if (!image.naturalWidth || !image.naturalHeight) {
        return;
      }

      const viewportRect = viewport.getBoundingClientRect();

      const fitRatio = Math.min(
        viewportRect.width / image.naturalWidth,
        viewportRect.height / image.naturalHeight
      );

      image.style.width = `${image.naturalWidth * fitRatio}px`;
      image.style.height = `${image.naturalHeight * fitRatio}px`;

      apply();
    }

    function apply() {
      image.style.transform =
        `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${scale})`;
    }

    function clampScale(value) {
      return Math.min(maxScale, Math.max(minScale, value));
    }

    function pointerDistance() {
      const pointers = Array.from(activePointers.values());

      if (pointers.length < 2) {
        return 0;
      }

      const dx = pointers[0].clientX - pointers[1].clientX;
      const dy = pointers[0].clientY - pointers[1].clientY;

      return Math.hypot(dx, dy);
    }

    function onPointerDown(event) {
      viewport.setPointerCapture?.(event.pointerId);

      activePointers.set(event.pointerId, {
        clientX: event.clientX,
        clientY: event.clientY,
      });

      if (activePointers.size === 1) {
        pointerStart = {
          clientX: event.clientX,
          clientY: event.clientY,
          x,
          y,
          time: Date.now(),
        };
      }

      if (activePointers.size === 2) {
        pinchStartDistance = pointerDistance();
        pinchStartScale = scale;
      }
    }

    function onPointerMove(event) {
      if (!activePointers.has(event.pointerId)) {
        return;
      }

      activePointers.set(event.pointerId, {
        clientX: event.clientX,
        clientY: event.clientY,
      });

      if (activePointers.size === 2) {
        const distance = pointerDistance();

        if (pinchStartDistance > 0) {
          scale = clampScale(
            pinchStartScale * (distance / pinchStartDistance)
          );
          apply();
        }

        return;
      }

      if (activePointers.size === 1 && pointerStart && scale > minScale) {
        x = pointerStart.x + (event.clientX - pointerStart.clientX);
        y = pointerStart.y + (event.clientY - pointerStart.clientY);
        apply();
      }
    }

    function onPointerUp(event) {
      const endPointer = activePointers.get(event.pointerId);

      if (
        allowSwipeAtMinScale &&
        activePointers.size === 1 &&
        pointerStart &&
        endPointer &&
        scale <= minScale + 0.01
      ) {
        const deltaX = endPointer.clientX - pointerStart.clientX;
        const elapsed = Date.now() - pointerStart.time;

        if (elapsed < 600 && Math.abs(deltaX) > 60) {
          if (deltaX < 0) {
            onSwipeLeft?.();
          } else {
            onSwipeRight?.();
          }
        }
      }

      activePointers.delete(event.pointerId);

      if (activePointers.size === 0) {
        pointerStart = null;
      }
    }

    image.addEventListener("load", sizeToViewport);

    viewport.addEventListener("pointerdown", onPointerDown);
    viewport.addEventListener("pointermove", onPointerMove);
    viewport.addEventListener("pointerup", onPointerUp);
    viewport.addEventListener("pointercancel", onPointerUp);

    window.addEventListener("resize", sizeToViewport);

    return {
      fit,
      reset: fit,
      getScale: () => scale,
    };
  }

  window.EX_APP.panZoom = {
    create: createPanZoom,
  };
})();
