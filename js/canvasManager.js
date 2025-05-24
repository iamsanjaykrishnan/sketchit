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
        if (state.showPencilSketch && dom.overlayCanvas) delete dom.overlayCanvas.dataset.sketchApplied;
        state.setIsPencilSketchApplied(false);
        return;
    }

    const oldCanvasDrawingWidth = dom.overlayCanvas.width;

    const img = state.currentImageElement;
    const canvas = dom.overlayCanvas;
    const container = img.parentElement;

    const cW = container.offsetWidth;
    const cH = container.offsetHeight;
    const imgW = img.naturalWidth;
    const imgH = img.naturalHeight;

    if (cW <= 0 || cH <= 0 || imgW <= 0 || imgH <= 0) {
        console.warn(`Resize skipped: Invalid dimensions - Container: ${cW}x${cH}, Image: ${imgW}x${imgH}`);
        if (state.showPencilSketch && dom.overlayCanvas) delete dom.overlayCanvas.dataset.sketchApplied;
        state.setIsPencilSketchApplied(false);
        return;
    }

    let finalScale = Math.min(cW / imgW, cH / imgH);
    img.style.width = `${imgW * finalScale}px`;
    img.style.height = `${imgH * finalScale}px`;

    const rW = imgW * finalScale;
    const rH = imgH * finalScale;
    const oX = (cW - rW) / 2;
    const oY = (cH - rH) / 2;

    if (isNaN(rW) || isNaN(rH) || isNaN(oX) || isNaN(oY)) {
        console.error("Resize Error: Calculated NaN values.", { rW, rH, oX, oY, finalScale });
        if (state.showPencilSketch && dom.overlayCanvas) delete dom.overlayCanvas.dataset.sketchApplied;
        state.setIsPencilSketchApplied(false);
        return;
    }

    const newCanvasDrawingWidth = Math.max(0, rW);
    const newCanvasDrawingHeight = Math.max(0, rH);
    const canvasResized = canvas.width !== newCanvasDrawingWidth || canvas.height !== newCanvasDrawingHeight;

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
    
    if (canvasResized) {
        if (state.showPencilSketch && dom.overlayCanvas) delete dom.overlayCanvas.dataset.sketchApplied;
        state.setIsPencilSketchApplied(false);
    }

    if (oldCanvasDrawingWidth > 0 && newCanvasDrawingWidth > 0) {
        const scaleFactor = newCanvasDrawingWidth / oldCanvasDrawingWidth;
        if (Math.abs(scaleFactor - 1.0) > 0.0001) {
            if (state.draggablePoseLandmarks.length > 0) {
                state.draggablePoseLandmarks.forEach(singlePoseLandmarks => {
                    singlePoseLandmarks.forEach(landmark => {
                        landmark.x *= scaleFactor;
                        landmark.y *= scaleFactor;
                    });
                });
            }
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
    } else if (state.lastPoseDetections?.landmarks?.length > 0 && newCanvasDrawingWidth > 0 && newCanvasDrawingHeight > 0 && state.draggablePoseLandmarks.length === 0) {
        const newDraggableLandmarks = state.lastPoseDetections.landmarks.map(singlePoseLms =>
            singlePoseLms.map(lm => ({
                x: lm.x * newCanvasDrawingWidth,
                y: lm.y * newCanvasDrawingHeight,
                visibility: lm.visibility
            }))
        );
        state.setDraggablePoseLandmarks(newDraggableLandmarks);
    }
    redrawCanvas();
}

function getGrayscaleImageData(originalImageData) {
    const grayscaleData = new Uint8ClampedArray(originalImageData.data.length);
    const originalPixels = originalImageData.data;
    for (let i = 0; i < originalPixels.length; i += 4) {
        const r = originalPixels[i];
        const g = originalPixels[i + 1];
        const b = originalPixels[i + 2];
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        grayscaleData[i] = gray;
        grayscaleData[i + 1] = gray;
        grayscaleData[i + 2] = gray;
        grayscaleData[i + 3] = originalPixels[i + 3]; // Alpha
    }
    return new ImageData(grayscaleData, originalImageData.width, originalImageData.height);
}

function getInvertedImageData(originalImageData) {
    const invertedData = new Uint8ClampedArray(originalImageData.data.length);
    const originalPixels = originalImageData.data;
    for (let i = 0; i < originalPixels.length; i += 4) {
        invertedData[i] = 255 - originalPixels[i];     // R
        invertedData[i + 1] = 255 - originalPixels[i + 1]; // G
        invertedData[i + 2] = 255 - originalPixels[i + 2]; // B
        invertedData[i + 3] = originalPixels[i + 3];     // Alpha
    }
    return new ImageData(invertedData, originalImageData.width, originalImageData.height);
}

function getBlurredImageData(imageDataToBlur, blurAmount = 2, tempBlurCanvas) {
    // Uses a temporary canvas to apply filter blur
    tempBlurCanvas.width = imageDataToBlur.width;
    tempBlurCanvas.height = imageDataToBlur.height;
    const blurCtx = tempBlurCanvas.getContext('2d');
    
    blurCtx.putImageData(imageDataToBlur, 0, 0);
    blurCtx.filter = `blur(${blurAmount}px)`;
    blurCtx.drawImage(tempBlurCanvas, 0, 0); // Draw onto itself to apply filter
    
    // To ensure filter is applied before getImageData, we draw again without filter
    blurCtx.filter = 'none'; 
    blurCtx.drawImage(tempBlurCanvas, 0,0);

    return blurCtx.getImageData(0, 0, tempBlurCanvas.width, tempBlurCanvas.height);
}

function colorDodgeBlend(baseImageData, blendImageData) {
    const outputData = new Uint8ClampedArray(baseImageData.data.length);
    const basePixels = baseImageData.data;
    const blendPixels = blendImageData.data;

    for (let i = 0; i < basePixels.length; i += 4) {
        for (let j = 0; j < 3; j++) { // R, G, B channels
            const base = basePixels[i + j];
            const blend = blendPixels[i + j];
            if (blend === 255) {
                outputData[i + j] = 255;
            } else {
                outputData[i + j] = Math.min(255, base / (1 - blend / 255));
            }
        }
        outputData[i + 3] = basePixels[i + 3]; // Alpha
    }
    return new ImageData(outputData, baseImageData.width, baseImageData.height);
}

// Store temp canvas globally within the module to reuse
let _tempSketchCanvas = null;
let _tempBlurCanvas = null;


function applyPencilSketchFilter(originalImageData) {
    if (!_tempSketchCanvas) _tempSketchCanvas = document.createElement('canvas');
    if (!_tempBlurCanvas) _tempBlurCanvas = document.createElement('canvas');

    // 1. Grayscale
    const grayscaleImgData = getGrayscaleImageData(originalImageData);

    // 2. Invert
    const invertedImgData = getInvertedImageData(grayscaleImgData);
    
    // 3. Blur inverted image
    // A larger blur can make it look more "smudged"
    const blurredInvertedImgData = getBlurredImageData(invertedImgData, 2, _tempBlurCanvas);

    // 4. Blend (Color Dodge) grayscale with blurred-inverted
    const finalSketchImageData = colorDodgeBlend(grayscaleImgData, blurredInvertedImgData);
    
    return finalSketchImageData;
}


export function redrawCanvas() {
    utils.clearCanvas(); // Clears the main overlayCanvas
    if (!dom.canvasCtx || !state.currentImageElement || dom.overlayCanvas.width === 0 || dom.overlayCanvas.height === 0) {
        uiManager.updateIconStates();
        return;
    }

    // Use the module-level temporary canvas for drawing the base image (original or sketched)
    if (!_tempSketchCanvas) _tempSketchCanvas = document.createElement('canvas');
    _tempSketchCanvas.width = dom.overlayCanvas.width;
    _tempSketchCanvas.height = dom.overlayCanvas.height;
    const tempCtx = _tempSketchCanvas.getContext('2d');

    // Draw the original image onto the temporary canvas first
    tempCtx.drawImage(state.currentImageElement, 0, 0, _tempSketchCanvas.width, _tempSketchCanvas.height);

    if (state.showPencilSketch) {
        if (!dom.overlayCanvas.dataset.sketchApplied || dom.overlayCanvas.dataset.sketchApplied !== "true") {
            try {
                let originalImageData = tempCtx.getImageData(0, 0, _tempSketchCanvas.width, _tempSketchCanvas.height);
                const sketchImageData = applyPencilSketchFilter(originalImageData);
                tempCtx.putImageData(sketchImageData, 0, 0);

                dom.overlayCanvas.dataset.sketchApplied = "true";
                state.setIsPencilSketchApplied(true);
            } catch (e) {
                console.error("Error applying pencil sketch filter:", e);
                utils.addComment("Could not apply pencil sketch. Displaying original.", "error");
                // tempCtx already has the original image if sketch fails
                state.setShowPencilSketch(false);
                state.setIsPencilSketchApplied(false);
                delete dom.overlayCanvas.dataset.sketchApplied;
            }
        } else if (state.isPencilSketchApplied) {
            // If already applied, re-apply from original to temp canvas to ensure it's there
            let originalImageData = tempCtx.getImageData(0, 0, _tempSketchCanvas.width, _tempSketchCanvas.height); // This will be original if we re-drew it.
            const sketchImageData = applyPencilSketchFilter(originalImageData); // Re-run the filter steps
            tempCtx.putImageData(sketchImageData, 0, 0);
        }
    } else {
        state.setIsPencilSketchApplied(false);
        delete dom.overlayCanvas.dataset.sketchApplied;
        // Original image is already on tempCtx
    }

    // Draw the content of the temporary canvas (original or sketched) to the main overlayCanvas
    dom.canvasCtx.drawImage(_tempSketchCanvas, 0, 0);

    // --- Overlay other elements on top ---
    const definingManualGrid = state.isManualGridModeActive || state.isDrawingManualGrid || state.isAdjustingManualGrid;

    if (state.showFaceLandmarks && state.lastFaceDetections && !definingManualGrid) {
        drawFaceLandmarksInternal(state.lastFaceDetections, state.selectedReferenceFaceIndex);
    }
    if (state.showPoseLandmarks && state.draggablePoseLandmarks.length > 0 && !definingManualGrid) {
        drawPoseLandmarksInternal();
    }

    if (state.isDrawingManualGrid) {
        drawManualGridSelection();
    } else if (state.isAdjustingManualGrid && state.manualGridRect) {
        drawAdjustableGridSquare();
    } else if (state.showFinalManualGrid && state.finalManualGridRect) {
        drawGridFromRect(state.finalManualGridRect);
    }
    uiManager.updateIconStates();
}

function drawFaceLandmarksInternal(results, gridFaceIndex = null) {
    if (!results?.faceLandmarks || !state.drawingUtils || results.faceLandmarks.length === 0) return;

    results.faceLandmarks.forEach((landmarks, index) => {
        const isSelected = index === gridFaceIndex;
        const eyeColor = isSelected ? "#FF3030" : "#FFA0A0";
        const lipColor = isSelected ? "#E0E0E0" : "#B0B0B0";
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
            if (landmarkDrawingIdx <= 10) return;
            if (p && typeof p.x === 'number' && typeof p.y === 'number') {
                dom.canvasCtx.beginPath();
                dom.canvasCtx.arc(p.x, p.y, config.POINT_RADIUS, 0, 2 * Math.PI);
                dom.canvasCtx.fill();

                if (state.isDraggingPosePoint && state.draggedPointInfo &&
                    state.draggedPointInfo.poseIndex === poseDrawingIdx &&
                    state.draggedPointInfo.pointIndex === landmarkDrawingIdx) {
                    dom.canvasCtx.strokeStyle = '#0000FF';
                    dom.canvasCtx.lineWidth = 2;
                    dom.canvasCtx.stroke();
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
    uiManager.updateAdjustmentHandles();
}


export function drawGridFromRect(gridRect) {
    if (!gridRect || gridRect.size <= 0 || !dom.canvasCtx || !dom.overlayCanvas) return;
    const { x: startX, y: startY, size } = gridRect;
    const endX = startX + size;
    const endY = startY + size;
    const canvasWidth = dom.overlayCanvas.width;
    const canvasHeight = dom.overlayCanvas.height;

    dom.canvasCtx.lineWidth = 1.5;

    dom.canvasCtx.strokeStyle = 'rgba(0, 123, 255, 0.75)';
    for (let currentX = startX; currentX < canvasWidth + size; currentX += size) { if (currentX >= -size && size > 0) { dom.canvasCtx.beginPath(); dom.canvasCtx.moveTo(currentX, 0); dom.canvasCtx.lineTo(currentX, canvasHeight); dom.canvasCtx.stroke(); } if (size === 0) break; }
    for (let currentX = startX - size; currentX > -size; currentX -= size) { if (currentX < canvasWidth + size && size > 0) { dom.canvasCtx.beginPath(); dom.canvasCtx.moveTo(currentX, 0); dom.canvasCtx.lineTo(currentX, canvasHeight); dom.canvasCtx.stroke(); } if (size === 0) break; }

    dom.canvasCtx.strokeStyle = 'rgba(255, 193, 7, 0.75)';
    for (let currentY = startY; currentY < canvasHeight + size; currentY += size) { if (currentY >= -size && size > 0) { dom.canvasCtx.beginPath(); dom.canvasCtx.moveTo(0, currentY); dom.canvasCtx.lineTo(canvasWidth, currentY); dom.canvasCtx.stroke(); } if (size === 0) break; }
    for (let currentY = startY - size; currentY > -size; currentY -= size) { if (currentY < canvasHeight + size && size > 0) { dom.canvasCtx.beginPath(); dom.canvasCtx.moveTo(0, currentY); dom.canvasCtx.lineTo(canvasWidth, currentY); dom.canvasCtx.stroke(); } if (size === 0) break; }

    if (size > 0) {
        dom.canvasCtx.lineWidth = 0.5;
        const thirdSize = size / 3;
        dom.canvasCtx.strokeStyle = 'rgba(0, 255, 0, 0.7)';
        dom.canvasCtx.beginPath(); dom.canvasCtx.moveTo(startX + thirdSize, startY); dom.canvasCtx.lineTo(startX + thirdSize, endY); dom.canvasCtx.stroke();
        dom.canvasCtx.beginPath(); dom.canvasCtx.moveTo(startX + 2 * thirdSize, startY); dom.canvasCtx.lineTo(startX + 2 * thirdSize, endY); dom.canvasCtx.stroke();
        dom.canvasCtx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
        dom.canvasCtx.beginPath(); dom.canvasCtx.moveTo(startX, startY + thirdSize); dom.canvasCtx.lineTo(endX, startY + thirdSize); dom.canvasCtx.stroke();
        dom.canvasCtx.beginPath(); dom.canvasCtx.moveTo(startX, startY + 2 * thirdSize); dom.canvasCtx.lineTo(endX, startY + 2 * thirdSize); dom.canvasCtx.stroke();
    }

    dom.canvasCtx.strokeStyle = 'rgba(255, 0, 255, 0.9)';
    dom.canvasCtx.lineWidth = 2;
    dom.canvasCtx.strokeRect(startX, startY, size, size);
}