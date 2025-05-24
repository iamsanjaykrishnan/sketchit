// js/main.js
import { DrawingUtils } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";
import * as dom from './domElements.js';
import * as state from './state.js';
import * as config from './config.js';
import * as utils from './utils.js';
import * as mediaPipeManager from './mediaPipeManager.js';
import * as uiManager from './uiManager.js';
import * as canvasManager from './canvasManager.js';
import * as eventHandlers from './eventHandlers.js';

// --- Image Loading Functions (moved from original script, now in main) ---
export function processImageFile(file) {
    // uiManager.resetCommonState(); // Called by initiator (handleFileInputChange, handleDrop)
    if (file && file.type.startsWith('image/')) {
        utils.addComment(`Loading image "${file.name}"...`, 'info');
        const reader = new FileReader();
        reader.onload = (e) => {
            if (dom.imagePreview) {
                dom.imagePreview.crossOrigin = "Anonymous"; // For MediaPipe if image is from different origin (though dataURL is same origin)
                dom.imagePreview.src = e.target.result;
                dom.imagePreview.onload = () => {
                    state.setCurrentImageElement(dom.imagePreview);
                    if (dom.uploadCard) dom.uploadCard.classList.add('hidden');
                    if (dom.newUploadButtonExt) dom.newUploadButtonExt.classList.remove('hidden');
                    if (dom.imagePreviewContainer) dom.imagePreviewContainer.classList.remove('hidden');
                    dom.imagePreview.classList.remove('hidden');
                    if (dom.placeholderText) dom.placeholderText.classList.add('hidden');

                    canvasManager.resizeCanvasToImage(); // Critical to call after image is loaded and dimensions are known
                    utils.addComment(`Image loaded. Ready for detection or manual grid.`, 'success');
                    uiManager.updateIconStates();
                };
                dom.imagePreview.onerror = () => {
                    utils.addComment(`Error displaying loaded image file.`, 'error');
                    uiManager.resetFullPreview();
                };
            }
        }
        reader.onerror = (e) => {
            utils.addComment(`Error reading image file: ${e.target.error || 'Unknown error'}`, 'error');
            uiManager.resetFullPreview();
        };
        reader.readAsDataURL(file);
    } else {
        const message = file ? `Invalid file type: "${file.type}". Only images allowed.` : 'No valid image file provided.';
        utils.addComment(message, 'error');
        uiManager.resetFullPreview();
    }
}

export function processImageUrl(url) {
    // uiManager.resetCommonState(); // Called by initiator (handleDrop)
    if (!url) {
        utils.addComment('No image URL provided.', 'error');
        uiManager.resetFullPreview();
        return;
    }
    utils.addComment(`Loading image from URL: ${url.substring(0,100)}...`, 'info');
    if (dom.imagePreview) {
        dom.imagePreview.crossOrigin = "Anonymous"; // Crucial for external URLs
        dom.imagePreview.src = url;
        dom.imagePreview.onload = () => {
            state.setCurrentImageElement(dom.imagePreview);
            if (dom.uploadCard) dom.uploadCard.classList.add('hidden');
            if (dom.newUploadButtonExt) dom.newUploadButtonExt.classList.remove('hidden');
            if (dom.imagePreviewContainer) dom.imagePreviewContainer.classList.remove('hidden');
            dom.imagePreview.classList.remove('hidden');
            if (dom.placeholderText) dom.placeholderText.classList.add('hidden');

            canvasManager.resizeCanvasToImage();
            utils.addComment(`Image from URL loaded. Ready for detection or manual grid.`, 'success');
            try { // Check for CORS issues that might block MediaPipe
                const tempCanvas = document.createElement('canvas'); tempCanvas.width = 1; tempCanvas.height = 1;
                const tempCtx = tempCanvas.getContext('2d'); tempCtx.drawImage(dom.imagePreview, 0, 0, 1, 1); tempCtx.getImageData(0, 0, 1, 1);
            } catch (e) {
                if (e.name === "SecurityError") { utils.addComment(`Image loaded, but it's from a different origin without CORS headers. MediaPipe detection might not work.`, 'warning'); }
                else { console.warn("Unexpected error checking canvas taint:", e); }
            }
            uiManager.updateIconStates();
        };
        dom.imagePreview.onerror = () => {
            utils.addComment(`Error loading image from URL. Check the URL and network.`, 'error');
            uiManager.resetFullPreview();
        };
    }
}


// --- Initialization ---
async function initializeApp() {
    if (dom.canvasCtx) {
        state.setDrawingUtils(new DrawingUtils(dom.canvasCtx));
    } else {
        console.error("Failed to get canvas context. Cannot initialize drawing ails.");
        utils.addComment("Error: Canvas not found. Sketchit cannot run.", "error");
        return;
    }

    uiManager.resetCommonState(); // Set initial UI state correctly

    try {
        const db = await utils.openDB(config.DB_NAME, config.DB_VERSION);
        state.setLandmarkDB(db);
    } catch (error) {
        utils.addComment(`Failed to open model cache DB. Models will be downloaded each time. Error: ${error}`, 'warning');
    }

    // Initialize MediaPipe Landmarkers (don't await here if you want them to load in parallel)
    mediaPipeManager.initializeFaceLandmarker();
    mediaPipeManager.initializePoseLandmarker();

    utils.addComment('Ready. Upload an image or drop it here to start.', 'info');
    setupEventListeners();
}

function setupEventListeners() {
    if (dom.imageUpload) dom.imageUpload.addEventListener('change', eventHandlers.handleFileInputChange);
    if (dom.iconFace) dom.iconFace.addEventListener('click', eventHandlers.handleFaceIconClick);
    if (dom.iconPose) dom.iconPose.addEventListener('click', eventHandlers.handlePoseIconClick);
    if (dom.iconGrid) dom.iconGrid.addEventListener('click', eventHandlers.handleGridIconClick);
    if (dom.iconRestart) dom.iconRestart.addEventListener('click', eventHandlers.handleRestartIconClick);
    if (dom.confirmGridButton) dom.confirmGridButton.addEventListener('click', eventHandlers.handleConfirmGrid);
    if (dom.cancelModalButton) dom.cancelModalButton.addEventListener('click', eventHandlers.handleModalCancelButtonClick);
    if (dom.faceSelectionModal) dom.faceSelectionModal.addEventListener('click', eventHandlers.handleModalOverlayClick);
    if (dom.newUploadButtonExt) dom.newUploadButtonExt.addEventListener('click', eventHandlers.handleNewUploadButtonClick);
    if (dom.iconPencilSketch) dom.iconPencilSketch.addEventListener('click', eventHandlers.handlePencilSketchIconClick);

    // Canvas Listeners
    if (dom.overlayCanvas) {
        dom.overlayCanvas.addEventListener('mousedown', eventHandlers.handleCanvasMouseDown);
        dom.overlayCanvas.addEventListener('mousemove', eventHandlers.handleCanvasMouseMove);
        // Mouseup should be on window to catch drags outside canvas
        window.addEventListener('mouseup', eventHandlers.handleCanvasMouseUp);

        // Touch events
        dom.overlayCanvas.addEventListener('touchstart', eventHandlers.handleCanvasMouseDown, { passive: false });
        dom.overlayCanvas.addEventListener('touchmove', eventHandlers.handleCanvasMouseMove, { passive: false });
        window.addEventListener('touchend', eventHandlers.handleCanvasMouseUp);
        window.addEventListener('touchcancel', eventHandlers.handleCanvasMouseUp); // Treat cancel like touchend
    }

    // Body Drag/Drop Listeners
    if (dom.bodyElement) {
        dom.bodyElement.addEventListener('dragover', eventHandlers.handleBodyDragOver);
        dom.bodyElement.addEventListener('dragleave', eventHandlers.handleBodyDragLeave);
        dom.bodyElement.addEventListener('drop', eventHandlers.handleBodyDrop);
    }

    // Window Resize Listener
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (state.currentImageElement && dom.imagePreviewContainer && !dom.imagePreviewContainer.classList.contains('hidden')) {
                canvasManager.resizeCanvasToImage();
            }
        }, 150); // Debounce resize event
    });
}

// --- Initial Page Load Setup ---
initializeApp();