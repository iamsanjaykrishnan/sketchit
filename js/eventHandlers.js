// js/eventHandlers.js
import * as _dom from './domElements.js';
import * as state from './state.js';
import * as config from './config.js';
import * as utils from './utils.js';
import * as mediaPipeManager from './mediaPipeManager.js';
import * as uiManager from './uiManager.js';
import * as canvasManager from './canvasManager.js';
import * as _main from './main.js';

export function handleFileInputChange(event) {
    uiManager.resetCommonState();
    const file = event.target.files ? event.target.files[0] : null;
    if (file) {
        _main.processImageFile(file);
    } else {
        utils.addComment('No file selected.', 'info');
    }
}

export function handleFaceIconClick() {
    if (!state.isFaceLandmarkerInitialized || !state.currentImageElement || _dom.iconFace.classList.contains('disabled')) return;
    state.setShowFaceLandmarks(!state.showFaceLandmarks);
    if (state.showFaceLandmarks) {
        utils.addComment('Showing face landmarks/grid...', 'info');
        if (!state.lastFaceDetections) {
            const modalShown = mediaPipeManager.detectFaces();
            if (modalShown) return;
        } else if (state.lastFaceDetections.faceLandmarks.length > 1 && state.selectedReferenceFaceIndex === null) {
            utils.addComment(`Select face for grid.`, 'info');
            uiManager.showFaceSelectionModal(state.lastFaceDetections.faceLandmarks.length);
            return;
        }
        canvasManager.redrawCanvas();
    } else {
        utils.addComment('Hiding face landmarks/grid.', 'info');
        uiManager.hideFaceSelectionModal();
        canvasManager.redrawCanvas();
    }
    uiManager.updateIconStates();
}

export function handlePoseIconClick() {
    if (!state.isPoseLandmarkerInitialized || !state.currentImageElement || _dom.iconPose.classList.contains('disabled')) return;
    state.setShowPoseLandmarks(!state.showPoseLandmarks);
    if (state.showPoseLandmarks) {
        utils.addComment('Showing pose landmarks...', 'info');
        if (!state.lastPoseDetections) {
            mediaPipeManager.detectPoses();
        } else if (state.draggablePoseLandmarks.length === 0 && state.lastPoseDetections?.landmarks?.length > 0) {
            utils.addComment('Restoring previous pose data...', 'info');
            const newDraggableLandmarks = state.lastPoseDetections.landmarks.map(singlePoseLms =>
                singlePoseLms.map(lm => ({
                    x: lm.x * _dom.overlayCanvas.width,
                    y: lm.y * _dom.overlayCanvas.height,
                    visibility: lm.visibility
                }))
            );
            state.setDraggablePoseLandmarks(newDraggableLandmarks);
        }
        canvasManager.redrawCanvas();
    } else {
        utils.addComment('Hiding pose landmarks.', 'info');
        canvasManager.redrawCanvas();
    }
    uiManager.updateIconStates();
}

export function handleGridIconClick() {
    // [Grid Icon Click] Start
    if (!_dom.iconGrid || !state.currentImageElement || _dom.iconGrid.classList.contains('disabled')) {
        // [Grid Icon Click] Guard failed: No icon, no image, or icon disabled.
        return;
    }

    if (state.finalManualGridRect) {
        // [Grid Icon Click] Handling toggle for finalManualGridRect.
        if (state.showFinalManualGrid) {
            state.setShowFinalManualGrid(false);
            utils.addComment('Hiding confirmed manual grid.', 'info');
            // [Grid Icon Click] Hiding final grid. Resetting modes.
            state.setIsManualGridModeActive(false);
            state.setIsDrawingManualGrid(false);
            state.setIsAdjustingManualGrid(false);
            state.setManualGridRect(null);
            canvasManager.calculateAndUpdateHandlePositions();
        } else {
            state.setShowFinalManualGrid(true);
            utils.addComment('Showing confirmed manual grid.', 'info');
            // [Grid Icon Click] Showing final grid. Resetting modes.
            state.setIsManualGridModeActive(false);
            state.setIsDrawingManualGrid(false);
            state.setIsAdjustingManualGrid(false);
            state.setManualGridRect(null);
        }
    } else {
        // [Grid Icon Click] Handling new manual grid mode.
        const oldIsManualGridModeActive = state.isManualGridModeActive;
        state.setIsManualGridModeActive(!oldIsManualGridModeActive);
        // [Grid Icon Click] isManualGridModeActive toggled

        if (state.isManualGridModeActive) {
            utils.addComment('Manual Grid Mode: Click and drag on the image to define the grid square.', 'info', 'User');
            // [Grid Icon Click] Entered Manual Grid Mode. Resetting manual grid state.
            uiManager.resetManualGridState(false);
        } else {
            // [Grid Icon Click] Exited Manual Grid Mode.
            if (oldIsManualGridModeActive) {
                 if (state.isAdjustingManualGrid) utils.addComment('Manual grid adjustment cancelled by icon click.', 'info');
                 else if (state.isDrawingManualGrid) utils.addComment('Manual grid drawing cancelled by icon click.', 'info');
                 else utils.addComment('Exiting manual grid mode via icon click.', 'info');
            }
            uiManager.resetManualGridState(false);
        }
    }
    canvasManager.redrawCanvas();
    uiManager.updateIconStates();
    // [Grid Icon Click] End
}

export function handleConfirmGrid() {
    // [Confirm Grid] Clicked.
    if (!state.isAdjustingManualGrid || !state.manualGridRect) {
        // [Confirm Grid] Not in adjusting mode or no manualRect.
        return;
    }
    utils.addComment('Manual grid confirmed.', 'success', 'User');
    state.setFinalManualGridRect({ ...state.manualGridRect });
    state.setShowFinalManualGrid(true);
    // [Confirm Grid] finalManualGridRect set

    state.setIsAdjustingManualGrid(false);
    state.setIsManualGridModeActive(false);
    state.setManualGridRect(null);
    canvasManager.calculateAndUpdateHandlePositions();

    canvasManager.redrawCanvas();
    uiManager.updateIconStates();
}

export function handleFaceSelection(event) {
    const index = parseInt(event.target.dataset.index, 10);
    state.setSelectedReferenceFaceIndex(index);
    utils.addComment(`Selected Face ${index + 1} for grid.`, 'success', 'User');
    uiManager.hideFaceSelectionModal();
    canvasManager.redrawCanvas();
}

export function handleCanvasMouseDown(e) {
    if (!_dom.overlayCanvas) return;
    const pos = utils.getMousePos(_dom.overlayCanvas, e);
    let interactionStarted = false;
    // [Canvas MouseDown] Pos: X, Y. States: isAdjusting, isManualMode, isDrawing

    if (state.isAdjustingManualGrid && state.manualGridRect) {
        // [Canvas MouseDown] Attempting to adjust existing grid.
        // ... (adjustment logic as before) ...
        let handleClicked = false;
        for (const handle of state.adjustmentHandles) {
            const dx = pos.x - handle.x;
            const dy = pos.y - handle.y;
            if (dx * dx + dy * dy < config.HANDLE_HIT_RADIUS * config.HANDLE_HIT_RADIUS) {
                state.setDraggedHandleType(handle.type);
                state.setIsDraggingGridSquare(false);
                state.setGridDragStartX(state.manualGridRect.x); // Store for reference if needed
                state.setGridDragStartY(state.manualGridRect.y);
                // [Canvas MouseDown] Clicked handle
                handleClicked = true;
                interactionStarted = true;
                break;
            }
        }
        if (!handleClicked) {
            const { x, y, size } = state.manualGridRect;
            if (pos.x >= x && pos.x <= x + size && pos.y >= y && pos.y <= y + size) {
                state.setIsDraggingGridSquare(true);
                state.setDraggedHandleType(null);
                state.setDragOffsetX(pos.x - x);
                state.setDragOffsetY(pos.y - y);
                // [Canvas MouseDown] Started dragging grid square.
                interactionStarted = true;
            }
        }
    } else if (state.isManualGridModeActive && !state.isDrawingManualGrid) {
        // [Canvas MouseDown] Starting to draw new manual grid.
        state.setIsDrawingManualGrid(true);
        state.setManualGridStartX(pos.x);
        state.setManualGridStartY(pos.y);
        state.setManualGridCurrentX(pos.x);
        state.setManualGridCurrentY(pos.y);
        state.setManualGridRect(null);
        interactionStarted = true;
    } else if (state.showPoseLandmarks && state.draggablePoseLandmarks.length > 0) {
        // ... (pose dragging logic as before) ...
        for (let poseIdx = 0; poseIdx < state.draggablePoseLandmarks.length; poseIdx++) {
            const singlePoseLandmarks = state.draggablePoseLandmarks[poseIdx];
            for (let lmIdx = 0; lmIdx < singlePoseLandmarks.length; lmIdx++) {
                if (lmIdx <= 10) continue;
                const p = singlePoseLandmarks[lmIdx];
                if (!p || typeof p.x !== 'number' || typeof p.y !== 'number') continue;
                const dx = pos.x - p.x; const dy = pos.y - p.y;
                if (dx * dx + dy * dy < config.HIT_RADIUS * config.HIT_RADIUS) {
                    state.setIsDraggingPosePoint(true);
                    state.setDraggedPointInfo({ poseIndex: poseIdx, pointIndex: lmIdx });
                    state.setDragOffsetX(dx); state.setDragOffsetY(dy);
                    interactionStarted = true; break;
                }
            }
            if (interactionStarted) break;
        }
    }

    if (interactionStarted) {
        // [Canvas MouseDown] Interaction started.
        if (e.touches) e.preventDefault();
        canvasManager.redrawCanvas();
        uiManager.updateIconStates();
    } else {
        // [Canvas MouseDown] No interaction started.
    }
}

export function handleCanvasMouseMove(e) {
    if (!_dom.overlayCanvas) return;
    const pos = utils.getMousePos(_dom.overlayCanvas, e);
    const isCurrentlyDraggingSomething = state.draggedHandleType || state.isDraggingGridSquare || state.isDrawingManualGrid || state.isDraggingPosePoint;

    if (isCurrentlyDraggingSomething && e.touches) e.preventDefault();

    state.setIsHoveringPosePoint(false);
    state.setIsHoveringGridHandle(false);
    state.setIsHoveringGridSquare(false);

    if (state.draggedHandleType && state.isAdjustingManualGrid && state.manualGridRect) {
        // ... (logic as before, maybe add a console.log for new rect values)
        const currentX = pos.x; const currentY = pos.y;
        let { x, y, size } = state.manualGridRect;
        let newX = x, newY = y, newSize = size;
        const rightEdgeOriginal = x + size; const bottomEdgeOriginal = y + size;
        switch (state.draggedHandleType) {
            case 'tl': newSize = Math.max(rightEdgeOriginal - currentX, bottomEdgeOriginal - currentY, config.MIN_GRID_SIZE); newX = rightEdgeOriginal - newSize; newY = bottomEdgeOriginal - newSize; break;
            case 'tr': newSize = Math.max(currentX - x, bottomEdgeOriginal - currentY, config.MIN_GRID_SIZE); newY = bottomEdgeOriginal - newSize; break;
            case 'bl': newSize = Math.max(rightEdgeOriginal - currentX, currentY - y, config.MIN_GRID_SIZE); newX = rightEdgeOriginal - newSize; break;
            case 'br': newSize = Math.max(currentX - x, currentY - y, config.MIN_GRID_SIZE); break;
            case 'tm': { const newBottomEdge = y + size; newSize = Math.max(newBottomEdge - currentY, config.MIN_GRID_SIZE); const sizeChange = size - newSize; newX = x + sizeChange / 2; newY = newBottomEdge - newSize; break; }
            case 'bm': { newSize = Math.max(currentY - y, config.MIN_GRID_SIZE); const sizeChange = size - newSize; newX = x + sizeChange / 2; break; }
            case 'ml': { const newRightEdge = x + size; newSize = Math.max(newRightEdge - currentX, config.MIN_GRID_SIZE); const sizeChange = size - newSize; newX = newRightEdge - newSize; newY = y + sizeChange / 2; break; }
            case 'mr': { newSize = Math.max(currentX - x, config.MIN_GRID_SIZE); const sizeChange = size - newSize; newY = y + sizeChange / 2; break; }
        }
        state.setManualGridRect({ x: newX, y: newY, size: newSize });
        // console.log('[Canvas MouseMove] Dragging handle, new rect:', state.manualGridRect);
        canvasManager.calculateAndUpdateHandlePositions();
        requestAnimationFrame(canvasManager.redrawCanvas);
    } else if (state.isDraggingGridSquare && state.isAdjustingManualGrid && state.manualGridRect) {
        // ... (logic as before, maybe add a console.log)
        let newX = pos.x - state.dragOffsetX; let newY = pos.y - state.dragOffsetY;
        newX = Math.max(0, Math.min(_dom.overlayCanvas.width - state.manualGridRect.size, newX));
        newY = Math.max(0, Math.min(_dom.overlayCanvas.height - state.manualGridRect.size, newY));
        state.setManualGridRect({ ...state.manualGridRect, x: newX, y: newY });
        // console.log('[Canvas MouseMove] Dragging square, new rect:', state.manualGridRect);
        canvasManager.calculateAndUpdateHandlePositions();
        requestAnimationFrame(canvasManager.redrawCanvas);
    } else if (state.isDrawingManualGrid) {
        state.setManualGridCurrentX(pos.x);
        state.setManualGridCurrentY(pos.y);
        // console.log(`[Canvas MouseMove] Drawing grid. CurrentX: ${pos.x}, CurrentY: ${pos.y}`);
        requestAnimationFrame(canvasManager.redrawCanvas);
    } else if (state.isDraggingPosePoint && state.draggedPointInfo) {
        // ... (pose logic) ...
        const draggedPose = state.draggablePoseLandmarks[state.draggedPointInfo.poseIndex];
        if (draggedPose) {
            const point = draggedPose[state.draggedPointInfo.pointIndex];
            if (point) {
                point.x = pos.x - state.dragOffsetX; point.y = pos.y - state.dragOffsetY;
                point.x = Math.max(0, Math.min(_dom.overlayCanvas.width, point.x));
                point.y = Math.max(0, Math.min(_dom.overlayCanvas.height, point.y));
                requestAnimationFrame(canvasManager.redrawCanvas);
            }
        }
    } else { // Not dragging, check hovers
        // ... (hover logic as before) ...
        const definingManualGrid = state.isManualGridModeActive || state.isDrawingManualGrid || state.isAdjustingManualGrid;
        if (state.showPoseLandmarks && !definingManualGrid && state.draggablePoseLandmarks.length > 0) {
            for (let poseIdx = 0; poseIdx < state.draggablePoseLandmarks.length; poseIdx++) {
                 const singlePoseLandmarks = state.draggablePoseLandmarks[poseIdx];
                 for (let lmIdx = 0; lmIdx < singlePoseLandmarks.length; lmIdx++) {
                    if (lmIdx <= 10) continue; const p = singlePoseLandmarks[lmIdx]; if (!p) continue;
                    const dx = pos.x - p.x; const dy = pos.y - p.y;
                    if (dx * dx + dy * dy < config.HIT_RADIUS * config.HIT_RADIUS) { state.setIsHoveringPosePoint(true); break; }
                } if (state.isHoveringPosePoint) break;
            }
        }
        if (state.isAdjustingManualGrid && state.manualGridRect) {
            for (const handle of state.adjustmentHandles) {
                const dx = pos.x - handle.x; const dy = pos.y - handle.y;
                if (dx * dx + dy * dy < config.HANDLE_HIT_RADIUS * config.HANDLE_HIT_RADIUS) { state.setIsHoveringGridHandle(true); break; }
            }
            if (!state.isHoveringGridHandle) {
                const { x, y, size } = state.manualGridRect;
                if (pos.x >= x && pos.x <= x + size && pos.y >= y && pos.y <= y + size) { state.setIsHoveringGridSquare(true); }
            }
        }
        uiManager.updateIconStates();
    }
}

export function handleCanvasMouseUp(e) {
    // [Canvas MouseUp] States before processing: isDrawing, draggedHandle, isDraggingSquare
    if (state.draggedHandleType || state.isDraggingGridSquare) {
        // [Canvas MouseUp] Finished dragging handle or square.
        state.setDraggedHandleType(null);
        state.setIsDraggingGridSquare(false);
        // isAdjustingManualGrid remains true
    } else if (state.isDrawingManualGrid) {
        // [Canvas MouseUp] Finished drawing new grid.
        state.setIsDrawingManualGrid(false);
        const width = state.manualGridCurrentX - state.manualGridStartX;
        const height = state.manualGridCurrentY - state.manualGridStartY;
        let size = Math.max(Math.abs(width), Math.abs(height));
        // [Canvas MouseUp] Drawn size

        if (size >= config.MIN_GRID_SIZE) {
            const finalStartX = width >= 0 ? state.manualGridStartX : state.manualGridStartX - size;
            const finalStartY = height >= 0 ? state.manualGridStartY : state.manualGridStartY - size;
            state.setManualGridRect({ x: finalStartX, y: finalStartY, size: size });
            state.setIsAdjustingManualGrid(true);
            state.setIsManualGridModeActive(false); // Important!
            utils.addComment(`Grid square drawn. Adjust size/position and click Confirm.`, 'info', 'User');
            // [Canvas MouseUp] Grid drawn, entering adjustment. New rect
            canvasManager.calculateAndUpdateHandlePositions();
        } else {
            utils.addComment(`Manual grid square too small (min ${config.MIN_GRID_SIZE}px), cancelled.`, 'warning');
            // [Canvas MouseUp] Grid too small, cancelled.
            state.setManualGridRect(null);
            state.setIsManualGridModeActive(false);
        }
    } else if (state.isDraggingPosePoint) {
        // [Canvas MouseUp] Finished dragging pose point.
        state.setIsDraggingPosePoint(false);
        state.setDraggedPointInfo(null);
        state.setDragOffsetX(0); state.setDragOffsetY(0);
    }
    canvasManager.redrawCanvas();
    uiManager.updateIconStates();
    // [Canvas MouseUp] End processing.
}

export function handleBodyDragOver(event) {
    event.preventDefault(); event.stopPropagation();
    const dt = event.dataTransfer;
    if (dt.types.includes('Files') || dt.types.includes('text/uri-list') || dt.types.includes('text/html')) {
        _dom.bodyElement.classList.add('dragover'); dt.dropEffect = 'copy';
    } else { dt.dropEffect = 'none'; }
}

export function handleBodyDragLeave(event) {
    event.preventDefault(); event.stopPropagation();
    if (!_dom.bodyElement.contains(event.relatedTarget)) { _dom.bodyElement.classList.remove('dragover'); }
}

export function handleBodyDrop(event) {
    event.preventDefault(); event.stopPropagation();
    _dom.bodyElement.classList.remove('dragover');
    uiManager.resetCommonState();
    const dt = event.dataTransfer; const files = dt.files; let processed = false;
    if (files.length > 0) {
        for (let i = 0; i < files.length; i++) { if (files[i].type.startsWith('image/')) { _main.processImageFile(files[i]); processed = true; break; } }
    }
    if (!processed && dt.types.includes('text/uri-list')) {
        const uriList = dt.getData('text/uri-list'); const lines = uriList.split('\n');
        for (const line of lines) { const url = line.trim(); if (url && !url.startsWith('#') && /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(url)) { _main.processImageUrl(url); processed = true; break; } }
        if (!processed) { console.log("URI List found, but no valid image URL detected:", uriList); }
    }
    if (!processed && dt.types.includes('text/html')) {
        const html = dt.getData('text/html');
        try { const tempDiv = document.createElement('div'); tempDiv.innerHTML = html; const imgElement = tempDiv.querySelector('img'); if (imgElement?.src) { _main.processImageUrl(imgElement.src); processed = true; } else { console.log("HTML found, but no <img> tag with src detected:", html); } }
        catch (e) { console.error("Error parsing dropped HTML:", e); }
    }
    if (!processed) { utils.addComment('Could not find a valid image file or URL in the dropped item.', 'error'); uiManager.resetFullPreview(); }
}

export function handleRestartIconClick() {
    if (state.currentImageElement || !_dom.imagePreviewContainer.classList.contains('hidden')) {
        uiManager.clearOverlays();
    } else {
        utils.addComment('No image loaded to clear overlays from.', 'info');
    }
}

export function handleNewUploadButtonClick() { if (_dom.imageUpload) _dom.imageUpload.click(); }

export function handleModalCancelButtonClick() {
    utils.addComment('Face selection cancelled.', 'info');
    uiManager.hideFaceSelectionModal();
    state.setSelectedReferenceFaceIndex(null);
    canvasManager.redrawCanvas();
    uiManager.updateIconStates();
}

export function handleModalOverlayClick(event) { if (event.target === _dom.faceSelectionModal) { handleModalCancelButtonClick(); } }


export function handlePencilSketchIconClick() {
    if (!_dom.iconPencilSketch || !_dom.iconPencilSketch || _dom.iconPencilSketch.classList.contains('disabled')) return;

    state.setShowPencilSketch(!state.showPencilSketch);

    if (state.showPencilSketch) {
        utils.addComment('Applying pencil sketch effect...', 'info');
        // The actual application of the effect will happen in canvasManager.redrawCanvas
    } else {
        utils.addComment('Removing pencil sketch effect.', 'info');
    }
    canvasManager.redrawCanvas(); // Request a redraw
    uiManager.updateIconStates();
}
