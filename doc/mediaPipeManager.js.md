# JavaScript File: `js/mediaPipeManager.js`

This module is responsible for initializing, loading, and running the MediaPipe Face Landmarker and Pose Landmarker models. It handles fetching model assets (potentially from cache via IndexedDB or from network) and performing detections on the current image.

## Dependencies
*   `@mediapipe/tasks-vision`: Core MediaPipe classes (`FaceLandmarker`, `PoseLandmarker`, `FilesetResolver`).
*   `./config.js` (as `config`): For model URLs, keys, and the Vision Tasks WASM path.
*   `./state.js` (as `state`): For storing landmarker instances, initialization status, and detection results.
*   `./utils.js` (as `utils`): For utility functions like `addComment` and `getModelAssetBuffer` (which handles DB caching).
*   `./uiManager.js` (imported as `updateIconStates`, `showFaceSelectionModal`): For updating UI based on model loading status and detection results.
*   `./canvasManager.js` (imported as `redrawCanvas`): Although not directly used in this snippet, it's often called after detections.
*   `./domElements.js` (as `dom`): For accessing DOM elements, specifically `dom.overlayCanvas` for scaling detected pose landmarks.

## Core Functions

### `initializeVisionResolver()`
*   **Purpose:** Initializes the `FilesetResolver` from MediaPipe, which is needed to load WASM modules and other assets for the vision tasks.
*   **Logic:**
    1.  Checks if `state.visionResolver` is already initialized. If so, returns it.
    2.  If not, calls `FilesetResolver.forVisionTasks()` with the URL from `config.MEDIAPIPE_VISION_TASKS_URL`.
    3.  Stores the created resolver in `state.visionResolver`.
    4.  Adds comments to the UI about loading status.
    5.  Returns the resolver. Throws an error if initialization fails.

### `initializeFaceLandmarker()`
*   **Purpose:** Loads and initializes the Face Landmarker model.
*   **Logic:**
    1.  Calls `initializeVisionResolver()` to ensure the resolver is ready.
    2.  Uses `utils.getModelAssetBuffer()` to get the face landmarker model. This utility function first checks IndexedDB (using `config.FACE_MODEL_KEY`) and falls back to fetching from `config.FACE_MODEL_URL` if not cached.
    3.  If the model asset buffer is successfully obtained:
        *   Calls `FaceLandmarker.createFromOptions()` with the resolver and options (model buffer, GPU delegate, running mode "IMAGE", `numFaces: 3`, `outputFaceBlendshapes: true`).
        *   Stores the initialized landmarker in `state.faceLandmarker`.
        *   Sets `state.isFaceLandmarkerInitialized` to `true`.
    4.  Adds UI comments for loading status/errors.
    5.  Updates icon states via `uiManager.updateIconStates()` in a `finally` block.

### `initializePoseLandmarker()`
*   **Purpose:** Loads and initializes the Pose Landmarker model.
*   **Logic:**
    1.  Calls `initializeVisionResolver()`.
    2.  Uses `utils.getModelAssetBuffer()` to get the pose landmarker model (using `config.POSE_MODEL_KEY` and `config.POSE_MODEL_URL`).
    3.  If the model asset buffer is obtained:
        *   Calls `PoseLandmarker.createFromOptions()` with the resolver and options (model buffer, GPU delegate, running mode "IMAGE", `numPoses: 3`).
        *   Stores the initialized landmarker in `state.poseLandmarker`.
        *   Sets `state.isPoseLandmarkerInitialized` to `true`.
    4.  Adds UI comments for loading status/errors.
    5.  Updates icon states via `uiManager.updateIconStates()` in a `finally` block.

### `detectFaces()`
*   **Purpose:** Performs face detection on the `state.currentImageElement` using the initialized `state.faceLandmarker`.
*   **Logic:**
    1.  Checks if the landmarker is ready and an image is loaded.
    2.  Calls `state.faceLandmarker.detect()` with the image.
    3.  Stores the results in `state.lastFaceDetections`.
    4.  If faces are found (`results.faceLandmarks.length > 0`):
        *   If more than one face is detected, clears `state.selectedReferenceFaceIndex` and calls `uiManager.showFaceSelectionModal()`. Returns `true` (modal shown).
        *   If one face is detected, sets `state.selectedReferenceFaceIndex` to `0`.
    5.  If no faces are detected, clears `state.lastFaceDetections` and sets `state.showFaceLandmarks` to `false`.
    6.  Adds UI comments about detection status/results.
    7.  Returns `false` if the modal was not shown.
    8.  Catches and logs errors, updating state and UI accordingly.

### `detectPoses()`
*   **Purpose:** Performs pose detection on the `state.currentImageElement` using the initialized `state.poseLandmarker`.
*   **Logic:**
    1.  Checks if the landmarker is ready and an image is loaded.
    2.  Calls `state.poseLandmarker.detect()` with the image.
    3.  Stores the results in `state.lastPoseDetections`.
    4.  If poses are found (`results.landmarks.length > 0`):
        *   Converts normalized landmark coordinates to pixel coordinates (scaled to `dom.overlayCanvas.width` and `dom.overlayCanvas.height`).
        *   Stores these pixel-space landmarks in `state.draggablePoseLandmarks`.
    5.  If no poses are detected, clears `state.draggablePoseLandmarks` and sets `state.showPoseLandmarks` to `false`.
    6.  Adds UI comments about detection status/results.
    7.  Catches and logs errors, updating state and UI accordingly.

## Error Handling
*   Each initialization and detection function includes `try...catch` blocks to handle potential errors (e.g., model loading failures, detection issues).
*   Error messages are displayed to the user via `utils.addComment()`.
*   Relevant state variables (e.g., `isFaceLandmarkerInitialized`, `showFaceLandmarks`) are updated to reflect failures, and UI icons are refreshed.

This module abstracts the complexities of interacting with MediaPipe models, providing a simpler interface for the rest of the application to initiate model loading and perform detections.
