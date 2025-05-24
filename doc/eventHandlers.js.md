# JavaScript File: `js/eventHandlers.js`

This module is central to the application's interactivity. It defines and manages all event listener functions for user interactions with DOM elements, canvas operations, and global events like drag-and-drop or window resizing.

## Dependencies
*   `./domElements.js` (as `_dom`): For accessing DOM elements to attach listeners or react to events.
*   `./state.js` (as `state`): For reading and updating the application's state in response to events.
*   `./config.js` (as `config`): For configuration values (e.g., hit radius for canvas interactions).
*   `./utils.js` (as `utils`): For utility functions like `addComment` and `getMousePos`.
*   `./mediaPipeManager.js` (as `mediaPipeManager`): For triggering MediaPipe detection tasks (faces, poses).
*   `./uiManager.js` (as `uiManager`): For updating UI elements, managing modals, and resetting states.
*   `./canvasManager.js` (as `canvasManager`): For redrawing the canvas and managing canvas-specific logic like grid handle calculations.
*   `./main.js` (as `_main`): For processing image files/URLs.

## Event Handler Functions

### Image Upload and Processing
*   **`handleFileInputChange(event)`**:
    *   Triggered by the 'change' event on the file input (`_dom.imageUpload`).
    *   Resets common UI state via `uiManager.resetCommonState()`.
    *   Retrieves the selected file and calls `_main.processImageFile()` to handle it.
*   **`handleBodyDragOver(event)`**:
    *   Attached to `document.body`'s 'dragover' event.
    *   Prevents default behavior and stop propagation.
    *   Adds a 'dragover' class to the body for visual feedback if files or specific data types are being dragged. Sets `dropEffect`.
*   **`handleBodyDragLeave(event)`**:
    *   Attached to `document.body`'s 'dragleave' event.
    *   Removes the 'dragover' class if the drag leaves the window.
*   **`handleBodyDrop(event)`**:
    *   Attached to `document.body`'s 'drop' event.
    *   Prevents default behavior and stop propagation. Removes 'dragover' class.
    *   Resets common UI state.
    *   Processes dropped items:
        *   If files are present, iterates and calls `_main.processImageFile()` for the first image file.
        *   If no image file, checks for `text/uri-list` and calls `_main.processImageUrl()` for the first valid image URL.
        *   If still no image, checks for `text/html`, parses it to find an `<img>` tag, and calls `_main.processImageUrl()` with its `src`.
        *   If no valid image is found, adds an error comment.
*   **`handleNewUploadButtonClick()`**:
    *   Triggered by clicking `_dom.newUploadButtonExt`.
    *   Programmatically clicks the hidden file input `_dom.imageUpload`.

### Icon Click Handlers
*   **`handleFaceIconClick()`**:
    *   Toggles `state.showFaceLandmarks`.
    *   If enabling:
        *   If face detections (`state.lastFaceDetections`) are missing, calls `mediaPipeManager.detectFaces()`. If this shows a modal (multiple faces), it returns early.
        *   If multiple faces were detected previously and none selected, shows the face selection modal.
    *   Calls `canvasManager.redrawCanvas()` and `uiManager.updateIconStates()`.
*   **`handlePoseIconClick()`**:
    *   Toggles `state.showPoseLandmarks`.
    *   If enabling:
        *   If pose detections (`state.lastPoseDetections`) are missing, calls `mediaPipeManager.detectPoses()`.
        *   If detections exist but `state.draggablePoseLandmarks` is empty, it repopulates draggable landmarks from the last detection.
    *   Calls `canvasManager.redrawCanvas()` and `uiManager.updateIconStates()`.
*   **`handleGridIconClick()`**:
    *   Manages the state of manual grid drawing.
    *   If a `state.finalManualGridRect` exists: Toggles `state.showFinalManualGrid`.
    *   Else: Toggles `state.isManualGridModeActive`.
        *   If entering manual grid mode, resets related grid state.
        *   If exiting, provides feedback and resets grid state.
    *   Calls `canvasManager.redrawCanvas()` and `uiManager.updateIconStates()`.
*   **`handleRestartIconClick()`**:
    *   If an image is loaded, calls `uiManager.clearOverlays()` to remove all drawings and reset detection data.

### Manual Grid Confirmation
*   **`handleConfirmGrid()`**:
    *   Triggered by `_dom.confirmGridButton`.
    *   If in `state.isAdjustingManualGrid` and `state.manualGridRect` exists:
        *   Copies `state.manualGridRect` to `state.finalManualGridRect`.
        *   Sets `state.showFinalManualGrid` to true.
        *   Resets adjustment/manual mode states.
        *   Calls `canvasManager.calculateAndUpdateHandlePositions()`, `canvasManager.redrawCanvas()`, and `uiManager.updateIconStates()`.

### Modal Interactions
*   **`handleFaceSelection(event)`**:
    *   Triggered by clicking a face selection button in the modal.
    *   Sets `state.selectedReferenceFaceIndex` based on `event.target.dataset.index`.
    *   Hides the modal and redraws the canvas.
*   **`handleModalCancelButtonClick()`**:
    *   Hides the face selection modal, clears `state.selectedReferenceFaceIndex`, redraws canvas, and updates icons.
*   **`handleModalOverlayClick(event)`**:
    *   If the click occurs on the modal overlay itself (not content), calls `handleModalCancelButtonClick()`.

### Canvas Mouse/Touch Interactions
These handlers manage drawing, dragging, and adjusting elements on the `_dom.overlayCanvas`.

*   **`handleCanvasMouseDown(e)` / `handleCanvasTouchStart(e)`**:
    *   Gets mouse/touch position using `utils.getMousePos()`.
    *   **Priority of actions:**
        1.  If `state.isAdjustingManualGrid`: Checks for clicks on adjustment handles (`state.adjustmentHandles`) or within the grid square itself to initiate dragging/resizing. Sets `state.draggedHandleType` or `state.isDraggingGridSquare`.
        2.  Else if `state.isManualGridModeActive` (and not already drawing): Initiates new manual grid drawing by setting `state.isDrawingManualGrid` and recording start coordinates.
        3.  Else if `state.showPoseLandmarks`: Checks for clicks on draggable pose points to initiate dragging. Sets `state.isDraggingPosePoint` and `state.draggedPointInfo`.
    *   If any interaction started, prevents default touch behavior, redraws canvas, and updates icons.
*   **`handleCanvasMouseMove(e)` / `handleCanvasTouchMove(e)`**:
    *   Gets mouse/touch position.
    *   If dragging an **adjustment handle** (`state.draggedHandleType`):
        *   Calculates new `x`, `y`, and `size` for `state.manualGridRect` based on the handle type and mouse position, ensuring `MIN_GRID_SIZE`.
        *   Updates handle positions and redraws canvas.
    *   Else if dragging the **grid square** (`state.isDraggingGridSquare`):
        *   Updates `state.manualGridRect.x` and `state.manualGridRect.y` based on mouse position and initial drag offset, clamping within canvas bounds.
        *   Updates handle positions and redraws canvas.
    *   Else if **drawing a new grid** (`state.isDrawingManualGrid`):
        *   Updates `state.manualGridCurrentX` and `state.manualGridCurrentY`.
        *   Redraws canvas (to show the selection rectangle).
    *   Else if dragging a **pose point** (`state.isDraggingPosePoint`):
        *   Updates the `x`, `y` of the dragged point in `state.draggablePoseLandmarks`, clamping within canvas bounds.
        *   Redraws canvas.
    *   Else (not dragging): Checks for hover states over pose points or grid handles/square to update cursor styles via `uiManager.updateIconStates()`.
*   **`handleCanvasMouseUp(e)` / `handleCanvasTouchEnd(e)`**:
    *   If finishing a **handle drag** or **square drag**: Resets `state.draggedHandleType` and `state.isDraggingGridSquare`.
    *   Else if finishing **drawing a new grid** (`state.isDrawingManualGrid`):
        *   Sets `state.isDrawingManualGrid` to false.
        *   Calculates final size. If `>= MIN_GRID_SIZE`:
            *   Sets `state.manualGridRect` with the final dimensions.
            *   Transitions to adjustment mode: `state.setIsAdjustingManualGrid(true)`, `state.setIsManualGridModeActive(false)`.
            *   Updates handles.
        *   Else (too small): Resets `state.manualGridRect` and `state.isManualGridModeActive`.
    *   Else if finishing **dragging a pose point**: Resets `state.isDraggingPosePoint` and related drag info.
    *   Redraws canvas and updates icon states.

## Setup
These event handlers are typically registered in the `initializeApp` or `setupEventListeners` function in `main.js`. Mouseup and touchend events are often attached to the `window` to correctly capture drags that end outside the canvas.

This module acts as the primary bridge between user actions and the application's logic and state management.
```
