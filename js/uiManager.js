// js/uiManager.js
import * as dom from './domElements.js';
import * as state from './state.js';
import * as canvasManager from './canvasManager.js'; // For redrawCanvas
import * as utils from './utils.js'; // For addComment
import { handleFaceSelection } from './eventHandlers.js'; // For attaching to modal buttons


export function showFaceSelectionModal(numFaces) {
    dom.modalFaceButtons.innerHTML = ''; // Clear previous buttons
    for (let i = 0; i < numFaces; i++) {
        const button = document.createElement('button');
        button.textContent = `Face ${i + 1}`;
        button.classList.add('select-face-btn'); // Tailwind should pick this up if defined or use your CSS
        button.dataset.index = i;
        button.addEventListener('click', handleFaceSelection);
        dom.modalFaceButtons.appendChild(button);
    }
    dom.faceSelectionModal.classList.add('visible');
}

export function hideFaceSelectionModal() {
    dom.faceSelectionModal.classList.remove('visible');
}

export function resetPreviewVisuals() {
    if (dom.uploadCard) dom.uploadCard.classList.remove('hidden');
    if (dom.imagePreviewContainer) dom.imagePreviewContainer.classList.add('hidden');
    if (dom.newUploadButtonExt) dom.newUploadButtonExt.classList.add('hidden');

    if (dom.imagePreview) {
        dom.imagePreview.removeAttribute('src');
        dom.imagePreview.removeAttribute('crossOrigin');
        dom.imagePreview.classList.add('hidden');
    }
    if (dom.placeholderText) dom.placeholderText.classList.add('hidden'); // Ensure placeholder is hidden too
}


export function updateIconStates() {
    if (!dom.iconFace || !dom.iconPose || !dom.iconGrid || !dom.overlayCanvas || !dom.confirmGridButton) return;

    const imageLoadedAndVisible = !!state.currentImageElement && !dom.imagePreviewContainer.classList.contains('hidden');
    const definingManualGrid = state.isManualGridModeActive || state.isDrawingManualGrid || state.isAdjustingManualGrid;

    // Face Icon
    const faceDisabled = !state.isFaceLandmarkerInitialized || !imageLoadedAndVisible || definingManualGrid;
    dom.iconFace.classList.toggle('disabled', faceDisabled);
    dom.iconFace.classList.toggle('active', state.showFaceLandmarks && !faceDisabled);
    dom.iconFace.title = faceDisabled ? (imageLoadedAndVisible ? (definingManualGrid ? "Disabled during grid definition" : "Face Landmarker not ready") : "Load an image first") : (state.showFaceLandmarks ? "Hide Face Landmarks / Grid" : "Show Face Landmarks / Grid");

    // Pose Icon
    const poseDisabled = !state.isPoseLandmarkerInitialized || !imageLoadedAndVisible || definingManualGrid;
    dom.iconPose.classList.toggle('disabled', poseDisabled);
    dom.iconPose.classList.toggle('active', state.showPoseLandmarks && !poseDisabled);
    dom.iconPose.title = poseDisabled ? (imageLoadedAndVisible ? (definingManualGrid ? "Disabled during grid definition" : "Pose Landmarker not ready") : "Load an image first") : (state.showPoseLandmarks ? "Hide Pose Landmarks" : "Show Pose Landmarks");

    // Grid Icon
    const gridDisabled = !imageLoadedAndVisible;
    dom.iconGrid.classList.toggle('disabled', gridDisabled);
    const gridActive = (definingManualGrid || (state.showFinalManualGrid && state.finalManualGridRect)) && !gridDisabled;
    dom.iconGrid.classList.toggle('active', gridActive);

    if (!imageLoadedAndVisible) dom.iconGrid.title = "Load an image first";
    else if (state.isAdjustingManualGrid) dom.iconGrid.title = "Cancel Grid Adjustment";
    else if (state.isDrawingManualGrid) dom.iconGrid.title = "Cancel Grid Drawing";
    else if (state.isManualGridModeActive) dom.iconGrid.title = "Cancel Manual Grid Mode";
    else if (state.finalManualGridRect) dom.iconGrid.title = state.showFinalManualGrid ? "Hide Confirmed Grid" : "Show Confirmed Grid";
    else dom.iconGrid.title = "Manually Draw Grid Square";


    // Canvas Cursors & Classes
    dom.overlayCanvas.classList.remove('manual-grid-drawing', 'manual-grid-adjusting', 'dragging-pose', 'dragging-grid-handle', 'dragging-grid-square', 'point-hover', 'handle-hover', 'square-hover');
    if (imageLoadedAndVisible) {
        if (state.isDrawingManualGrid) dom.overlayCanvas.classList.add('manual-grid-drawing');
        if (state.isAdjustingManualGrid) dom.overlayCanvas.classList.add('manual-grid-adjusting');
        if (state.isDraggingPosePoint) dom.overlayCanvas.classList.add('dragging-pose');
        if (state.draggedHandleType) dom.overlayCanvas.classList.add('dragging-grid-handle');
        if (state.isDraggingGridSquare) dom.overlayCanvas.classList.add('dragging-grid-square');

        // Hover states need to be updated in mousemove, but ensure classes are cleared if not active
        if (state.isHoveringPosePoint && !state.isDraggingPosePoint) dom.overlayCanvas.classList.add('point-hover');
        if (state.isHoveringGridHandle && !state.draggedHandleType) dom.overlayCanvas.classList.add('handle-hover');
        if (state.isHoveringGridSquare && !state.isDraggingGridSquare && !state.draggedHandleType) dom.overlayCanvas.classList.add('square-hover');
    }


    // Confirm Button Visibility
    const showConfirm = state.isAdjustingManualGrid && imageLoadedAndVisible;
    dom.confirmGridButton.classList.toggle('opacity-0', !showConfirm);
    dom.confirmGridButton.classList.toggle('invisible', !showConfirm);
    dom.confirmGridButton.classList.toggle('pointer-events-none', !showConfirm);
    // Ensure visible classes are added when showConfirm is true
    dom.confirmGridButton.classList.toggle('opacity-100', showConfirm);
    dom.confirmGridButton.classList.toggle('visible', showConfirm);
    dom.confirmGridButton.classList.toggle('pointer-events-auto', showConfirm);


    updateAdjustmentHandles();
}

export function updateAdjustmentHandles() {
    if (!dom.adjustmentHandlesContainer) return;
    dom.adjustmentHandlesContainer.innerHTML = ''; // Clear existing handles

    if (!state.isAdjustingManualGrid || !state.manualGridRect) return;

    state.adjustmentHandles.forEach(handle => {
        const handleElement = document.createElement('div');
        handleElement.className = 'adjustment-handle'; // Ensure this class is styled in your CSS
        handleElement.style.left = `${handle.x}px`;
        handleElement.style.top = `${handle.y}px`;
        handleElement.dataset.type = handle.type;
        dom.adjustmentHandlesContainer.appendChild(handleElement);
    });
}


export function resetManualGridState(resetConfirmedGrid = false) {
    state.setIsDrawingManualGrid(false);
    state.setIsAdjustingManualGrid(false);
    state.setManualGridRect(null);

    if (resetConfirmedGrid) {
        state.setFinalManualGridRect(null);
        state.setShowFinalManualGrid(false);
    }
    state.setAdjustmentHandles([]);
    state.setDraggedHandleType(null);
    state.setIsDraggingGridSquare(false);
    updateAdjustmentHandles(); // Clear visual handles
}

export function clearOverlays() {
    utils.addComment('Clearing overlays and detection data...', 'info', 'sketchit');
    let overlaysCleared = false;

    if (state.showFaceLandmarks) {
        state.setShowFaceLandmarks(false);
        state.setLastFaceDetections(null);
        state.setSelectedReferenceFaceIndex(null);
        hideFaceSelectionModal();
        overlaysCleared = true;
    }
    if (state.showPoseLandmarks) {
        state.setShowPoseLandmarks(false);
        state.setDraggablePoseLandmarks([]);
        state.setLastPoseDetections(null); // Also clear raw detections
        overlaysCleared = true;
    }

    if (
        state.showFinalManualGrid ||
        state.isManualGridModeActive ||
        state.isDrawingManualGrid ||
        state.isAdjustingManualGrid ||
        state.finalManualGridRect
    ) {
        resetManualGridState(true); // Reset confirmed grid too
        state.setIsManualGridModeActive(false); // Turn off mode
        overlaysCleared = true;
    }

    canvasManager.redrawCanvas(); // Redraw to reflect cleared state
    updateIconStates();

    if (!overlaysCleared) {
        utils.addComment('No active overlays to clear.', 'info');
    }
}


export function resetCommonState() {
    if (dom.commentArea) {
        dom.commentArea.innerHTML = '';
    }
    state.setIsCommentAreaInitialized(false);

    utils.clearCanvas();
    state.setCurrentImageElement(null);
    state.setLastFaceDetections(null);
    state.setLastPoseDetections(null);
    state.setDraggablePoseLandmarks([]);
    state.setDraggedPointInfo(null);
    state.setIsDraggingPosePoint(false);
    state.setDragOffsetX(0);
    state.setDragOffsetY(0);


    state.setSelectedReferenceFaceIndex(null);
    state.setShowFaceLandmarks(false);
    state.setShowPoseLandmarks(false);

    resetManualGridState(true); // Reset confirmed grid as well
    state.setIsManualGridModeActive(false); // Ensure manual grid mode is off


    resetPreviewVisuals(); // Handles visibility of upload card vs preview
    updateIconStates(); // Update icons based on the reset state
}

export function resetFullPreview() {
    resetCommonState(); // This now handles the bulk of the reset
    if (dom.imageUpload) {
        dom.imageUpload.value = null; // Clear the file input
    }
    // Add a generic message after reset if not already handled by resetCommonState's initial comment
    if (dom.commentArea && dom.commentArea.children.length === 0) {
         utils.addComment('Preview reset. Upload a new image or drop it here.', 'info');
    }
}