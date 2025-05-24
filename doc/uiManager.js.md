# JavaScript File: `js/uiManager.js`

This module is responsible for managing User Interface (UI) updates, interactions, and visual states that are not directly handled by the canvas. This includes managing modals, icon states, visibility of elements, and resetting parts of the UI.

## Dependencies
*   `./domElements.js` (as `dom`): For accessing and manipulating DOM elements.
*   `./state.js` (as `state`): For reading and updating application state to reflect UI changes or to determine how UI should look.
*   `./canvasManager.js` (as `canvasManager`): For triggering canvas redraws when UI actions necessitate it (e.g., clearing overlays).
*   `./utils.js` (as `utils`): For utility functions like `addComment` and `clearCanvas`.
*   `./eventHandlers.js` (imported as `handleFaceSelection`): For attaching event listeners to dynamically created elements (like modal buttons).

## Core Functions

### Modal Management
*   **`showFaceSelectionModal(numFaces)`**:
    *   Clears any previous buttons in `dom.modalFaceButtons`.
    *   Creates a button for each detected face (`Face 1`, `Face 2`, etc.).
    *   Assigns `data-index` to each button and attaches `eventHandlers.handleFaceSelection` as a click listener.
    *   Makes the `dom.faceSelectionModal` visible by adding the 'visible' class.
*   **`hideFaceSelectionModal()`**:
    *   Hides `dom.faceSelectionModal` by removing the 'visible' class.

### UI Element Visibility & State
*   **`resetPreviewVisuals()`**:
    *   Shows the `uploadCard` and hides `imagePreviewContainer` and `newUploadButtonExt`.
    *   Clears `src` and `crossOrigin` attributes from `imagePreview` and hides it.
    *   Hides `placeholderText`.
*   **`updateIconStates()`**:
    *   This is a crucial function that updates the appearance (enabled/disabled, active/inactive, title text) of control icons (`iconFace`, `iconPose`, `iconGrid`) and the visibility/state of the `confirmGridButton`.
    *   **Logic for Icons:**
        *   Determines if an image is loaded and visible (`imageLoadedAndVisible`).
        *   Determines if the user is currently defining a manual grid (`definingManualGrid`).
        *   **Face Icon (`dom.iconFace`):**
            *   Disabled if: landmarker not initialized, no image loaded, or `definingManualGrid` is true.
            *   Active if `state.showFaceLandmarks` is true and not disabled.
            *   Sets `title` attribute for tooltips.
        *   **Pose Icon (`dom.iconPose`):**
            *   Disabled if: landmarker not initialized, no image loaded, or `definingManualGrid` is true.
            *   Active if `state.showPoseLandmarks` is true and not disabled.
            *   Sets `title` attribute.
        *   **Grid Icon (`dom.iconGrid`):**
            *   Disabled if no image loaded.
            *   Active if (`definingManualGrid` or (`state.showFinalManualGrid` and `state.finalManualGridRect`)) and not disabled.
            *   Sets `title` attribute based on various manual grid states.
    *   **Canvas Cursors & Classes:**
        *   Removes all cursor/state related classes from `dom.overlayCanvas`.
        *   If an image is loaded, adds classes based on current interaction state: `manual-grid-drawing`, `manual-grid-adjusting`, `dragging-pose`, `dragging-grid-handle`, `dragging-grid-square`, `point-hover`, `handle-hover`, `square-hover`. These classes are used by CSS to change the cursor.
    *   **Confirm Button (`dom.confirmGridButton`):**
        *   Manages visibility (`opacity-0`/`invisible`/`pointer-events-none` vs. `opacity-100`/`visible`/`pointer-events-auto`) based on whether `state.isAdjustingManualGrid` is true and an image is loaded.
    *   Calls `updateAdjustmentHandles()` to refresh visual handles for the grid.
*   **`updateAdjustmentHandles()`**:
    *   Clears existing handles from `dom.adjustmentHandlesContainer`.
    *   If `state.isAdjustingManualGrid` and `state.manualGridRect` exist:
        *   Iterates through `state.adjustmentHandles` (which should be calculated by `canvasManager.calculateAndUpdateHandlePositions`).
        *   Creates a `div` for each handle, styles it with its position, sets `data-type`, and appends it to `dom.adjustmentHandlesContainer`.

### Resetting UI States
*   **`resetManualGridState(resetConfirmedGrid = false)`**:
    *   Resets flags: `isDrawingManualGrid`, `isAdjustingManualGrid` to `false`.
    *   Clears `manualGridRect`.
    *   If `resetConfirmedGrid` is true, also clears `finalManualGridRect` and `showFinalManualGrid`.
    *   Clears `adjustmentHandles`, `draggedHandleType`, `isDraggingGridSquare`.
    *   Calls `updateAdjustmentHandles()` to remove visual handles.
*   **`clearOverlays()`**:
    *   Resets states related to face landmarks, pose landmarks, and the manual grid.
    *   Specifically:
        *   Turns off `showFaceLandmarks`, clears `lastFaceDetections`, `selectedReferenceFaceIndex`, and hides the modal if `showFaceLandmarks` was true.
        *   Turns off `showPoseLandmarks`, clears `draggablePoseLandmarks`, `lastPoseDetections` if `showPoseLandmarks` was true.
        *   Calls `resetManualGridState(true)` and turns off `isManualGridModeActive` if any manual grid state was active.
    *   Calls `canvasManager.redrawCanvas()` and `updateIconStates()`.
    *   Adds a comment indicating whether overlays were cleared or if there were none to clear.
*   **`resetCommonState()`**:
    *   Clears the `dom.commentArea` and resets `state.isCommentAreaInitialized`.
    *   Calls `utils.clearCanvas()`.
    *   Resets various state variables: `currentImageElement`, detection data (`lastFaceDetections`, `lastPoseDetections`), pose dragging states (`draggablePoseLandmarks`, `draggedPointInfo`, etc.).
    *   Resets `selectedReferenceFaceIndex`, `showFaceLandmarks`, `showPoseLandmarks`.
    *   Calls `resetManualGridState(true)` and sets `isManualGridModeActive` to false.
    *   Calls `resetPreviewVisuals()` (to toggle upload card vs. image preview).
    *   Calls `updateIconStates()`.
*   **`resetFullPreview()`**:
    *   Calls `resetCommonState()` for the bulk of the reset.
    *   Clears the file input `dom.imageUpload.value = null`.
    *   Adds a default comment if the comment area is empty after the reset.

This module plays a critical role in keeping the user interface consistent with the application's internal state, providing visual cues, and managing the overall user experience flow.
```
