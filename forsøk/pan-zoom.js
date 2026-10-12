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
    rotation = 0,
  }) {
    if (!viewport || !image) {
      return null;
    }

    let scale = 1;
    let x = 0;
    let y = 0;
    let currentRotation = Number(rotation) || 0;

    let pointerStart = null;
    let pinchStartDistance = 0;
    let pinchStartScale = 1;
    let activePointers = new Map();

    function fit() {
      scale = 1;
      x = 0;
      y = 0;
      sizeToViewport();
      apply();
    }

    function sizeToViewport() {
      if (!image.naturalWidth || !image.naturalHeight) {
        return;
      }

      const viewportRect = viewport.getBoundingClientRect();

      const normalizedRotation =
        ((Number(currentRotation) % 360) + 360) % 360;

      const quarterTurn =
        normalizedRotation === 90 || normalizedRotation === 270;

      const visualWidth =
        quarterTurn ? image.naturalHeight : image.naturalWidth;

      const visualHeight =
        quarterTurn ? image.naturalWidth : image.naturalHeight;

      const fitRatio = Math.min(
        viewportRect.width / visualWidth,
        viewportRect.height / visualHeight
      );

      image.style.width = `${image.naturalWidth * fitRatio}px`;
      image.style.height = `${image.naturalHeight * fitRatio}px`;

      apply();
    }

    function apply() {
      image.style.transform =
        `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) ` +
        `scale(${scale}) rotate(${currentRotation}deg)`;
    }

    function clampScale(value) {
      return Math.min(maxScale, Math.max(minScale, value));
    }

    function setScale(nextScale) {
      const clamped = clampScale(nextScale);

      if (Math.abs(clamped - scale) < 0.001) {
        return;
      }

      scale = clamped;

      if (scale <= minScale + 0.001) {
        x = 0;
        y = 0;
      }

      apply();
    }

    function zoomIn() {
      setScale(scale * 1.25);
    }

    function zoomOut() {
      setScale(scale / 1.25);
    }

    function setRotation(nextRotation, { refit = true } = {}) {
      currentRotation = Number(nextRotation) || 0;

      if (refit) {
        fit();
      } else {
        sizeToViewport();
        apply();
      }
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

        viewport.classList.add("is-panning");
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
        viewport.classList.remove("is-panning");
      }
    }

    function onWheel(event) {
      /*
       * Desktop zoom:
       * mouse wheel / trackpad scroll zooms the image without changing page.
       * This works for both Pocket Guide and Poster.
       */
      event.preventDefault();

      const direction = event.deltaY < 0 ? 1 : -1;
      const factor = direction > 0 ? 1.14 : 1 / 1.14;

      setScale(scale * factor);
    }

    function onDoubleClick(event) {
      event.preventDefault();

      if (scale <= minScale + 0.01) {
        setScale(Math.min(maxScale, 2));
      } else {
        fit();
      }
    }

    image.addEventListener("load", sizeToViewport);

    viewport.addEventListener("pointerdown", onPointerDown);
    viewport.addEventListener("pointermove", onPointerMove);
    viewport.addEventListener("pointerup", onPointerUp);
    viewport.addEventListener("pointercancel", onPointerUp);
    viewport.addEventListener("wheel", onWheel, { passive: false });
    viewport.addEventListener("dblclick", onDoubleClick);

    window.addEventListener("resize", sizeToViewport);

    return {
      fit,
      reset: fit,
      zoomIn,
      zoomOut,
      setScale,
      setRotation,
      getScale: () => scale,
      getRotation: () => currentRotation,
    };
  }

  window.EX_APP.panZoom = {
    create: createPanZoom,
  };
})();
