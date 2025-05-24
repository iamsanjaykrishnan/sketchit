// js/canvasManager.js
import { FaceLandmarker, PoseLandmarker } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";
import * as dom from './domElements.js';
import * as state from './state.js';
import * as config from './config.js';
import * as utils from './utils.js';
import * as uiManager from './uiManager.js';

export function resizeCanvasToImage() {
    if (!state.currentImageElement || !dom.overlayCanvas || !dom.imagePreviewContainer ||
        !state.currentImageElement.naturalWidth || !state.currentImageElement.naturalHeight) {
        console.warn("Resize skipped: Missing elements or zero natural dimensions.");
        return;
    }

    const oldCanvasDrawingWidth = dom.overlayCanvas.width;
    const oldCanvasDrawingHeight = dom.overlayCanvas.height;

    const img = state.currentImageElement;
    const canvas = dom.overlayCanvas;
    const container = img.parentElement; // Should be .image-display-container

    const cW = container.offsetWidth;
    const cH = container.offsetHeight;
    const imgW = img.naturalWidth;
    const imgH = img.naturalHeight;

    if (cW <= 0 || cH <= 0 || imgW <= 0 || imgH <= 0) {
        console.warn(`Resize skipped: Invalid dimensions - Container: ${cW}x${cH}, Image: ${imgW}x${imgH}`);
        return;
    }

    let finalScale = Math.min(cW / imgW, cH / imgH);
    img.style.width = `${imgW * finalScale}px`;
    img.style.height = `${imgH * finalScale}px`;
    // img.style.objectFit = 'contain'; // Already set in CSS, but good to be explicit if needed

    const rW = imgW * finalScale; // Rendered width of the image
    const rH = imgH * finalScale; // Rendered height of the image

    const oX = (cW - rW) / 2; // Offset to center the image in its container
    const oY = (cH - rH) / 2;

    if (isNaN(rW) || isNaN(rH) || isNaN(oX) || isNaN(oY)) {
        console.error("Resize Error: Calculated NaN values.", { rW, rH, oX, oY, finalScale });
        return;
    }

    const newCanvasDrawingWidth = Math.max(0, rW);
    const newCanvasDrawingHeight = Math.max(0, rH);

    canvas.width = newCanvasDrawingWidth;
    canvas.height = newCanvasDrawingHeight;
    canvas.style.width = `${newCanvasDrawingWidth}px`;
    canvas.style.height = `${newCanvasDrawingHeight}px`;
    canvas.style.left = `${oX}px`;
    canvas.style.top = `${oY}px`;

    if (dom.adjustmentHandlesContainer) {
        dom.adjustmentHandlesContainer.style.left = `${oX}px`;
        dom.adjustmentHandlesContainer.style.top = `${oY}px`;
        dom.adjustmentHandlesContainer.style.width = `${newCanvasDrawingWidth}px`;
        dom.adjustmentHandlesContainer.style.height = `${newCanvasDrawingHeight}px`;
    }

    // Scale existing draggable pose landmarks
    if (oldCanvasDrawingWidth > 0 && newCanvasDrawingWidth > 0 && state.draggablePoseLandmarks.length > 0) {
        const scaleFactor = newCanvasDrawingWidth / oldCanvasDrawingWidth;
        if (Math.abs(scaleFactor - 1.0) > 0.0001) {
            state.draggablePoseLandmarks.forEach(singlePoseLandmarks => {
                singlePoseLandmarks.forEach(landmark => {
                    landmark.x *= scaleFactor;
                    landmark.y *= scaleFactor;
                });
            });
        }
    } else if (state.lastPoseDetections?.landmarks?.length > 0 && newCanvasDrawingWidth > 0 && newCanvasDrawingHeight > 0 && state.draggablePoseLandmarks.length === 0) {
        // Initialize from lastPoseDetections if draggable landmarks are empty (e.g., after initial load + resize)
         const newDraggableLandmarks = state.lastPoseDetections.landmarks.map(singlePoseLms =>
            singlePoseLms.map(lm => ({
                x: lm.x * newCanvasDrawingWidth,
                y: lm.y * newCanvasDrawingHeight,
                visibility: lm.visibility
            }))
        );
        state.setDraggablePoseLandmarks(newDraggableLandmarks);
    }


    // Scale manual grid
    if (oldCanvasDrawingWidth > 0 && newCanvasDrawingWidth > 0) {
        const scaleFactor = newCanvasDrawingWidth / oldCanvasDrawingWidth;
        if (Math.abs(scaleFactor - 1.0) > 0.0001) {
            if (state.manualGridRect && state.manualGridRect.size > 0) {
                state.manualGridRect.x *= scaleFactor;
                state.manualGridRect.y *= scaleFactor;
                state.manualGridRect.size *= scaleFactor;
                if (state.isAdjustingManualGrid) calculateAndUpdateHandlePositions();
            }
            if (state.finalManualGridRect && state.finalManualGridRect.size > 0) {
                state.finalManualGridRect.x *= scaleFactor;
                state.finalManualGridRect.y *= scaleFactor;
                state.finalManualGridRect.size *= scaleFactor;
            }
            if (state.isDrawingManualGrid) {
                state.setManualGridStartX(state.manualGridStartX * scaleFactor);
                state.setManualGridStartY(state.manualGridStartY * scaleFactor);
                state.setManualGridCurrentX(state.manualGridCurrentX * scaleFactor);
                state.setManualGridCurrentY(state.manualGridCurrentY * scaleFactor);
            }
        }
    }
    redrawCanvas();
}

export function redrawCanvas() {
    utils.clearCanvas();
    if (!dom.canvasCtx) return;

    if (state.showFaceLandmarks && state.lastFaceDetections && !state.isManualGridModeActive && !state.isDrawingManualGrid && !state.isAdjustingManualGrid) {
        drawFaceLandmarksInternal(state.lastFaceDetections, state.selectedReferenceFaceIndex);
    }
    if (state.showPoseLandmarks && state.draggablePoseLandmarks.length > 0 && !state.isManualGridModeActive && !state.isDrawingManualGrid && !state.isAdjustingManualGrid) {
        drawPoseLandmarksInternal();
    }

    if (state.isDrawingManualGrid) {
        drawManualGridSelection();
    } else if (state.isAdjustingManualGrid && state.manualGridRect) {
        drawAdjustableGridSquare();
    } else if (state.showFinalManualGrid && state.finalManualGridRect) {
        drawGridFromRect(state.finalManualGridRect);
    }
    uiManager.updateIconStates(); // Update icons which might depend on canvas state (like cursors)
}

function drawFaceLandmarksInternal(results, gridFaceIndex = null) {
    if (!results?.faceLandmarks || !state.drawingUtils || results.faceLandmarks.length === 0) return;

    results.faceLandmarks.forEach((landmarks, index) => {
        const isSelected = index === gridFaceIndex;
        const eyeColor = isSelected ? "#FF3030" : "#FFA0A0";
        const lipColor = isSelected ? "#E0E0E0" : "#B0B0B0"; // Lighter for selected
        const ovalColor = isSelected ? "#E0E0E0" : "#B0B0B0";

        if (landmarks?.length > 0) {
            try {
                state.drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, { color: eyeColor, lineWidth: 1 });
                state.drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, { color: eyeColor, lineWidth: 1 });
                state.drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, { color: ovalColor, lineWidth: 1 });
                state.drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LIPS, { color: lipColor, lineWidth: 1 });
            } catch (e) {
                if (isSelected) utils.addComment(`Error drawing basic landmarks for Face ${index + 1}.`, 'error');
                console.error("Error drawing face connectors:", e)
            }
        } else {
            if (isSelected) utils.addComment(`No landmarks available for selected Face ${index + 1}.`, 'info');
            return;
        }


        if (isSelected) {
            const pixelLandmarks = landmarks.map(p => ({
                x: p.x * dom.overlayCanvas.width,
                y: p.y * dom.overlayCanvas.height
            }));
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            pixelLandmarks.forEach(p => {
                minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
                minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
            });
            let faceWidth = maxX - minX;
            let faceHeight = maxY - minY;
            let gridSize = Math.max(faceWidth, faceHeight);

            if (gridSize > 0) {
                let midX = (minX + maxX) / 2;
                let midY = (minY + maxY) / 2;
                let gridStartX = midX - gridSize / 2;
                let gridStartY = midY - gridSize / 2;
                drawGridFromRect({ x: gridStartX, y: gridStartY, size: gridSize });
            } else {
                 utils.addComment(`Could not determine size for face grid (Face ${index + 1}).`, 'warning');
            }
        }
    });
}

function drawPoseLandmarksInternal() {
    if (!state.draggablePoseLandmarks || state.draggablePoseLandmarks.length === 0 || !state.drawingUtils || !dom.canvasCtx) return;
    const connections = PoseLandmarker.POSE_CONNECTIONS;
    if (!connections) { console.error("Pose connections not available."); return; }

    state.draggablePoseLandmarks.forEach((singlePoseLandmarks, poseDrawingIdx) => {
        if (!singlePoseLandmarks || singlePoseLandmarks.length === 0) return;

        const poseColor = ['#00FF00', '#00FFFF', '#FF00FF'][poseDrawingIdx % 3] || '#00FF00';
        const pointColor = ['#FF0000', '#FFFF00', '#0000FF'][poseDrawingIdx % 3] || '#FF0000';

        dom.canvasCtx.strokeStyle = poseColor;
        dom.canvasCtx.lineWidth = 2;
        connections.forEach((c) => {
            const startIdx = c.start;
            const endIdx = c.end;
            // Skip face landmarks (indices 0-10 are typically face for BlazePose)
            if (startIdx <= 10 || endIdx <= 10) return;

            if (startIdx < singlePoseLandmarks.length && endIdx < singlePoseLandmarks.length) {
                const startPoint = singlePoseLandmarks[startIdx];
                const endPoint = singlePoseLandmarks[endIdx];
                if (startPoint && endPoint && typeof startPoint.x === 'number' && typeof startPoint.y === 'number' &&
                    typeof endPoint.x === 'number' && typeof endPoint.y === 'number') {
                    dom.canvasCtx.beginPath();
                    dom.canvasCtx.moveTo(startPoint.x, startPoint.y);
                    dom.canvasCtx.lineTo(endPoint.x, endPoint.y);
                    dom.canvasCtx.stroke();
                }
            }
        });

        dom.canvasCtx.fillStyle = pointColor;
        singlePoseLandmarks.forEach((p, landmarkDrawingIdx) => {
            if (landmarkDrawingIdx <= 10) return; // Skip drawing face points themselves
            if (p && typeof p.x === 'number' && typeof p.y === 'number') {
                dom.canvasCtx.beginPath();
                dom.canvasCtx.arc(p.x, p.y, config.POINT_RADIUS, 0, 2 * Math.PI);
                dom.canvasCtx.fill();

                if (state.isDraggingPosePoint && state.draggedPointInfo &&
                    state.draggedPointInfo.poseIndex === poseDrawingIdx &&
                    state.draggedPointInfo.pointIndex === landmarkDrawingIdx) {
                    dom.canvasCtx.strokeStyle = '#0000FF'; // Highlight color for dragged point
                    dom.canvasCtx.lineWidth = 2;
                    dom.canvasCtx.stroke(); // Draw the highlight circle
                }
            }
        });
    });
}


function drawManualGridSelection() {
    if (!state.isDrawingManualGrid || !dom.canvasCtx) return;
    const width = state.manualGridCurrentX - state.manualGridStartX;
    const height = state.manualGridCurrentY - state.manualGridStartY;
    const size = Math.max(Math.abs(width), Math.abs(height));
    const endX = state.manualGridStartX + (width >= 0 ? size : -size);
    const endY = state.manualGridStartY + (height >= 0 ? size : -size);

    dom.canvasCtx.strokeStyle = 'rgba(255, 0, 255, 0.8)';
    dom.canvasCtx.lineWidth = 2;
    dom.canvasCtx.setLineDash([5, 5]);
    dom.canvasCtx.strokeRect(state.manualGridStartX, state.manualGridStartY, endX - state.manualGridStartX, endY - state.manualGridStartY);
    dom.canvasCtx.setLineDash([]);
}

function drawAdjustableGridSquare() {
    if (!state.manualGridRect || state.manualGridRect.size <= 0 || !dom.canvasCtx) return;
    const { x, y, size } = state.manualGridRect;
    dom.canvasCtx.strokeStyle = 'rgba(255, 0, 255, 0.9)';
    dom.canvasCtx.lineWidth = 2;
    dom.canvasCtx.strokeRect(x, y, size, size);
}

export function calculateAndUpdateHandlePositions() {
    const newHandles = [];
    if (!state.manualGridRect || !state.isAdjustingManualGrid) {
        state.setAdjustmentHandles(newHandles);
        uiManager.updateAdjustmentHandles(); // Will clear visual handles
        return;
    }

    const { x, y, size } = state.manualGridRect;
    const halfSize = size / 2;

    newHandles.push({ type: 'tl', x: x, y: y });
    newHandles.push({ type: 'tr', x: x + size, y: y });
    newHandles.push({ type: 'bl', x: x, y: y + size });
    newHandles.push({ type: 'br', x: x + size, y: y + size });
    newHandles.push({ type: 'tm', x: x + halfSize, y: y });
    newHandles.push({ type: 'bm', x: x + halfSize, y: y + size });
    newHandles.push({ type: 'ml', x: x, y: y + halfSize });
    newHandles.push({ type: 'mr', x: x + size, y: y + halfSize });

    state.setAdjustmentHandles(newHandles);
    uiManager.updateAdjustmentHandles(); // Update visual handles
}


export function drawGridFromRect(gridRect) {
    if (!gridRect || gridRect.size <= 0 || !dom.canvasCtx || !dom.overlayCanvas) return;
    const { x: startX, y: startY, size } = gridRect;
    const endX = startX + size;
    const endY = startY + size;
    const canvasWidth = dom.overlayCanvas.width;
    const canvasHeight = dom.overlayCanvas.height;

    dom.canvasCtx.lineWidth = 1;

    // Vertical Lines (Cyan)
    dom.canvasCtx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
    for (let currentX = startX; currentX < canvasWidth + size; currentX += size) { if (currentX >= -size && size > 0) { dom.canvasCtx.beginPath(); dom.canvasCtx.moveTo(currentX, 0); dom.canvasCtx.lineTo(currentX, canvasHeight); dom.canvasCtx.stroke(); } if (size === 0) break; }
    for (let currentX = startX - size; currentX > -size; currentX -= size) { if (currentX < canvasWidth + size && size > 0) { dom.canvasCtx.beginPath(); dom.canvasCtx.moveTo(currentX, 0); dom.canvasCtx.lineTo(currentX, canvasHeight); dom.canvasCtx.stroke(); } if (size === 0) break; }


    // Horizontal Lines (Yellow)
    dom.canvasCtx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
    for (let currentY = startY; currentY < canvasHeight + size; currentY += size) { if (currentY >= -size && size > 0) { dom.canvasCtx.beginPath(); dom.canvasCtx.moveTo(0, currentY); dom.canvasCtx.lineTo(canvasWidth, currentY); dom.canvasCtx.stroke(); } if (size === 0) break; }
    for (let currentY = startY - size; currentY > -size; currentY -= size) { if (currentY < canvasHeight + size && size > 0) { dom.canvasCtx.beginPath(); dom.canvasCtx.moveTo(0, currentY); dom.canvasCtx.lineTo(canvasWidth, currentY); dom.canvasCtx.stroke(); } if (size === 0) break; }


    // Inner Thirds Lines
    if (size > 0) {
        const thirdSize = size / 3;
        // Vertical thirds (Green)
        dom.canvasCtx.strokeStyle = 'rgba(0, 255, 0, 0.7)';
        dom.canvasCtx.beginPath(); dom.canvasCtx.moveTo(startX + thirdSize, startY); dom.canvasCtx.lineTo(startX + thirdSize, endY); dom.canvasCtx.stroke();
        dom.canvasCtx.beginPath(); dom.canvasCtx.moveTo(startX + 2 * thirdSize, startY); dom.canvasCtx.lineTo(startX + 2 * thirdSize, endY); dom.canvasCtx.stroke();
        // Horizontal thirds (Red)
        dom.canvasCtx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
        dom.canvasCtx.beginPath(); dom.canvasCtx.moveTo(startX, startY + thirdSize); dom.canvasCtx.lineTo(endX, startY + thirdSize); dom.canvasCtx.stroke();
        dom.canvasCtx.beginPath(); dom.canvasCtx.moveTo(startX, startY + 2 * thirdSize); dom.canvasCtx.lineTo(endX, startY + 2 * thirdSize); dom.canvasCtx.stroke();
    }

    // Defining square outline (Magenta)
    dom.canvasCtx.strokeStyle = 'rgba(255, 0, 255, 0.9)';
    dom.canvasCtx.lineWidth = 2;
    dom.canvasCtx.strokeRect(startX, startY, size, size);
}