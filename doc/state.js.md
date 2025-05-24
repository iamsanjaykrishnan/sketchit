# JavaScript File: `js/state.js`

This module serves as a centralized store for the global state of the Sketchit application. It exports variables that hold data related to MediaPipe instances, UI settings, detection results, manual grid interactions, and more. It also provides setter functions for updating these state variables, though direct modification is also possible if done carefully.

## Purpose
Centralizing state management helps in:
*   **Predictability:** Knowing where to find and modify application-wide data.
*   **Maintainability:** Easier to track how state changes affect different parts of the application.
*   **Debugging:** A single place to inspect the current state of the application.

## State Variables

### MediaPipe Instances & Initialization
*   `faceLandmarker`: Stores the initialized MediaPipe FaceLandmarker instance.
*   `poseLandmarker`: Stores the initialized MediaPipe PoseLandmarker instance.
*   `drawingUtils`: Stores an instance of MediaPipe's `DrawingUtils`.
*   `visionResolver`: Stores the MediaPipe `FilesetResolver` instance.
*   `isFaceLandmarkerInitialized`: Boolean flag, true if `faceLandmarker` is ready.
*   `isPoseLandmarkerInitialized`: Boolean flag, true if `poseLandmarker` is ready.

### Image & Detection Data
*   `currentImageElement`: Reference to the currently loaded `<img>` DOM element.
*   `lastFaceDetections`: Stores the raw results from the last face detection call.
*   `lastPoseDetections`: Stores the raw results from the last pose detection call.

### Draggable Pose State
*   `draggablePoseLandmarks`: An array of arrays. Each inner array holds landmark objects (with `x`, `y`, `visibility` in pixel coordinates) for a detected pose.
*   `draggedPointInfo`: An object `{ poseIndex: number, pointIndex: number }` indicating which pose landmark is currently being dragged. `null` if none.
*   `isDraggingPosePoint`: Boolean flag, true if a pose point is being dragged.
*   `dragOffsetX`, `dragOffsetY`: The offset between the mouse click and the actual point coordinates when dragging starts.

### Manual Grid State
*   `isManualGridModeActive`: Boolean, true when the user has clicked the grid icon to start the process of defining a grid, but hasn't started drawing yet.
*   `isDrawingManualGrid`: Boolean, true when the user is actively dragging the mouse to define the initial grid square.
*   `isAdjustingManualGrid`: Boolean, true when the initial grid square has been drawn, and adjustment handles are visible.
*   `manualGridStartX`, `manualGridStartY`: Pixel coordinates of where the manual grid drawing started.
*   `manualGridCurrentX`, `manualGridCurrentY`: Current pixel coordinates of the mouse while drawing the manual grid.
*   `manualGridRect`: An object `{ x, y, size }` storing the properties of the grid square currently being drawn or adjusted (in pixel coordinates).
*   `finalManualGridRect`: An object `{ x, y, size }` storing the properties of the confirmed manual grid.
*   `showFinalManualGrid`: Boolean, true if the confirmed manual grid should be displayed.
*   `adjustmentHandles`: An array of objects, each representing an adjustment handle for the `manualGridRect` (e.g., `{ type: 'tl', x: number, y: number }`).
*   `draggedHandleType`: String indicating the type of grid adjustment handle being dragged (e.g., 'tl', 'br', 'tm'). `null` if none.
*   `isDraggingGridSquare`: Boolean, true if the entire manual grid square is being dragged (not a handle).
*   `gridDragStartX`, `gridDragStartY`: Initial `x` and `y` of the `manualGridRect` when dragging the entire square begins.

### Hover State (for UI feedback like cursor changes)
*   `isHoveringPosePoint`: Boolean, true if the mouse is over a draggable pose point.
*   `isHoveringGridHandle`: Boolean, true if the mouse is over a grid adjustment handle.
*   `isHoveringGridSquare`: Boolean, true if the mouse is over the draggable area of the manual grid square (not a handle).

### Visibility State (for canvas elements)
*   `showFaceLandmarks`: Boolean, true if face landmarks (and related face grid) should be drawn.
*   `showPoseLandmarks`: Boolean, true if pose landmarks should be drawn.

### Other UI/App State
*   `isCommentAreaInitialized`: Boolean, true if the comment area has been cleared of its initial placeholder message.
*   `selectedReferenceFaceIndex`: Number (or `null`), the index of the face selected by the user when multiple faces are detected, used for drawing the face-derived grid.
*   `landmarkDB`: Stores the IndexedDB database instance used for caching models.

## Setter Functions
The module also exports setter functions for each state variable (e.g., `setFaceLandmarker(instance)`, `setIsDrawingManualGrid(value)`). While direct modification of the exported `let` variables is possible, using these setters can be helpful for debugging or if side-effects on state change are introduced later.

Example:
```javascript
// Directly
state.showFaceLandmarks = true;

// Using setter
state.setShowFaceLandmarks(true);
```

This comprehensive state management is crucial for coordinating the behavior of different modules and ensuring data consistency across the application.
```
