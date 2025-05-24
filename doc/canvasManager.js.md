# JavaScript File: `js/canvasManager.js`

This module is responsible for managing the HTML5 canvas used for overlaying drawings (landmarks, grids) on top of the uploaded image. It handles canvas resizing, redrawing, and rendering various visual elements.

## Dependencies

*   `@mediapipe/tasks-vision`: Specifically `FaceLandmarker` and `PoseLandmarker` for landmark definitions.
*   `./domElements.js` (as `dom`): For accessing canvas and image DOM elements.
*   `./state.js` (as `state`): For accessing application state (e.g., detection results, UI flags, manual grid details).
*   `./config.js` (as `config`): For configuration values like point radius.
*   `./utils.js` (as `utils`): For utility functions like `clearCanvas` and `addComment`.
*   `./uiManager.js` (as `uiManager`): For updating UI elements like icon states and adjustment handles.

## Core Functions

### `resizeCanvasToImage()`

*   **Purpose:** Adjusts the dimensions and position of the overlay canvas to match the displayed size and position of the uploaded image. This is crucial for accurate landmark and grid placement when the image is scaled to fit its container.
*   **Logic:**
    1.  Checks for the existence of necessary DOM elements (`currentImageElement`, `overlayCanvas`, `imagePreviewContainer`) and valid image dimensions.
    2.  Records the old canvas drawing dimensions to calculate scaling factors for existing drawings.
    3.  Calculates the scale factor to fit the image within its container while maintaining aspect ratio.
    4.  Sets the `style.width` and `style.height` of the `<img>` element.
    5.  Calculates the rendered width (`rW`), height (`rH`), and offset (`oX`, `oY`) of the image within its container.
    6.  Sets the `width`, `height`, and `style` (width, height, left, top) of the `overlayCanvas` to match the image's rendered dimensions and position.
    7.  Updates the position and dimensions of `adjustmentHandlesContainer` to align with the canvas.
    8.  **Scales Existing Drawings:**
        *   If draggable pose landmarks exist, their coordinates are scaled based on the change in canvas width.
        *   If no draggable landmarks exist but previous pose detections are available (e.g., after initial load and resize), initializes `draggablePoseLandmarks` from `lastPoseDetections`, scaling them to the new canvas size.
        *   If a manual grid (either being drawn, adjusted, or confirmed) exists, its coordinates and size are scaled.
    9.  Calls `redrawCanvas()` to update the display.

### `redrawCanvas()`

*   **Purpose:** Clears and redraws all active visual elements on the canvas based on the current application state.
*   **Logic:**
    1.  Clears the canvas using `utils.clearCanvas()`.
    2.  If `state.showFaceLandmarks` is true and face detection results (`state.lastFaceDetections`) are available (and not in manual grid mode), calls `drawFaceLandmarksInternal()`.
    3.  If `state.showPoseLandmarks` is true and draggable pose landmarks (`state.draggablePoseLandmarks`) are available (and not in manual grid mode), calls `drawPoseLandmarksInternal()`.
    4.  If `state.isDrawingManualGrid` is true, calls `drawManualGridSelection()` to show the selection rectangle.
    5.  Else if `state.isAdjustingManualGrid` and `state.manualGridRect` exist, calls `drawAdjustableGridSquare()`.
    6.  Else if `state.showFinalManualGrid` and `state.finalManualGridRect` exist, calls `drawGridFromRect()` with the confirmed grid.
    7.  Calls `uiManager.updateIconStates()` as some icon states might depend on canvas content/mode.

### `calculateAndUpdateHandlePositions()`

*   **Purpose:** Calculates the positions of adjustment handles for the manual grid square (if active) and updates the visual display of these handles via `uiManager.updateAdjustmentHandles()`.
*   **Logic:**
    1.  Clears existing handles in the state.
    2.  If `state.manualGridRect` exists and `state.isAdjustingManualGrid` is true:
        *   Calculates positions for 8 handles: top-left (tl), top-right (tr), bottom-left (bl), bottom-right (br), top-middle (tm), bottom-middle (bm), middle-left (ml), middle-right (mr).
    3.  Updates `state.adjustmentHandles` with the new handle positions.
    4.  Calls `uiManager.updateAdjustmentHandles()` to render them in the DOM.

### `drawGridFromRect(gridRect)`

*   **Purpose:** Draws a comprehensive grid based on a given rectangle (`gridRect` with `x`, `y`, `size`). This includes main grid lines extending across the canvas and inner third lines within the defining square.
*   **Parameters:**
    *   `gridRect`: An object `{ x, y, size }` defining the main square.
*   **Logic:**
    1.  Checks for valid `gridRect` and canvas context.
    2.  Calculates `endX` and `endY` for the main square.
    3.  **Vertical Lines (Cyan):** Draws lines extending from top to bottom of the canvas, spaced by `gridRect.size`, starting from `gridRect.x` and going both right and left.
    4.  **Horizontal Lines (Yellow):** Draws lines extending from left to right of the canvas, spaced by `gridRect.size`, starting from `gridRect.y` and going both down and up.
    5.  **Inner Thirds Lines:**
        *   Calculates `thirdSize = gridRect.size / 3`.
        *   Draws two vertical lines (Green) inside the main square at `x + thirdSize` and `x + 2 * thirdSize`.
        *   Draws two horizontal lines (Red) inside the main square at `y + thirdSize` and `y + 2 * thirdSize`.
    6.  **Defining Square Outline (Magenta):** Draws a thicker outline for the `gridRect` itself.

## Internal Drawing Functions

### `drawFaceLandmarksInternal(results, gridFaceIndex = null)`

*   **Purpose:** Draws face landmarks and, if a specific face is selected (`gridFaceIndex`), a grid based on that face's dimensions.
*   **Logic:**
    1.  Iterates through each set of `landmarks` in `results.faceLandmarks`.
    2.  Determines colors for eyes, lips, and face oval based on whether the current face is the `gridFaceIndex`.
    3.  Uses `state.drawingUtils.drawConnectors` to draw:
        *   Right eye, left eye.
        *   Face oval.
        *   Lips.
    4.  If the current face is the `gridFaceIndex`:
        *   Converts normalized landmark coordinates to pixel coordinates.
        *   Calculates the bounding box (min/max X and Y) of the face landmarks.
        *   Determines `gridSize` as the maximum of face width and height.
        *   Calculates the top-left starting point for a square grid centered on the face.
        *   Calls `drawGridFromRect()` to draw this face-derived grid.

### `drawPoseLandmarksInternal()`

*   **Purpose:** Draws pose landmarks (connections and points) based on `state.draggablePoseLandmarks`.
*   **Logic:**
    1.  Iterates through each set of `singlePoseLandmarks` in `state.draggablePoseLandmarks`.
    2.  Assigns a color for the pose (cycling through a predefined list).
    3.  Draws connections between pose landmarks using `PoseLandmarker.POSE_CONNECTIONS`, skipping facial landmarks (indices 0-10).
    4.  Draws circles for each landmark point (again, skipping facial landmarks) using `config.POINT_RADIUS`.
    5.  If a point is currently being dragged (`state.isDraggingPosePoint`), it's highlighted with an additional stroke.

### `drawManualGridSelection()`

*   **Purpose:** Draws the dashed rectangle representing the user's current selection while they are defining a manual grid square (dragging the mouse).
*   **Logic:**
    1.  Calculates the width and height of the selection based on `state.manualGridStartX/Y` and `state.manualGridCurrentX/Y`.
    2.  Determines the `size` of the square (max of absolute width and height) and adjusts `endX`, `endY` to maintain a square shape.
    3.  Draws a dashed rectangle using the calculated coordinates and dimensions.

### `drawAdjustableGridSquare()`

*   **Purpose:** Draws the outline of the manual grid square when it's in adjustment mode (after initial drawing, before confirming).
*   **Logic:**
    1.  Uses `state.manualGridRect` (x, y, size) to draw a solid rectangle.

## Key State Dependencies

This module heavily relies on the `state.js` module for:
*   `currentImageElement`, `lastFaceDetections`, `lastPoseDetections`, `draggablePoseLandmarks`
*   Flags like `showFaceLandmarks`, `showPoseLandmarks`, `isManualGridModeActive`, `isDrawingManualGrid`, `isAdjustingManualGrid`, `showFinalManualGrid`
*   Manual grid properties: `manualGridStartX/Y`, `manualGridCurrentX/Y`, `manualGridRect`, `finalManualGridRect`
*   `selectedReferenceFaceIndex`
*   `drawingUtils` (MediaPipe's DrawingUtils instance)

Proper management of these state variables in other modules (like `eventHandlers.js` and `uiManager.js`) is crucial for `canvasManager.js` to function correctly.
