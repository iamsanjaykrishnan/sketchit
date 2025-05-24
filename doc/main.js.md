# JavaScript File: `js/main.js`

This file serves as the main entry point and orchestrator for the Sketchit web application. It handles the initialization sequence, sets up global event listeners, and contains core functions for processing uploaded images (either from a file or a URL).

## Dependencies
*   `@mediapipe/tasks-vision`: Specifically `DrawingUtils` for creating a drawing utility instance.
*   `./domElements.js` (as `dom`): For accessing various DOM elements.
*   `./state.js` (as `state`): For managing and accessing the global application state.
*   `./config.js` (as `config`): For configuration constants (like IndexedDB names).
*   `./utils.js` (as `utils`): For utility functions (e.g., `addComment`, `openDB`).
*   `./mediaPipeManager.js` (as `mediaPipeManager`): For initializing and managing MediaPipe landmarkers.
*   `./uiManager.js` (as `uiManager`): For managing UI updates and user feedback.
*   `./canvasManager.js` (as `canvasManager`): For canvas-related operations like resizing.
*   `./eventHandlers.js` (as `eventHandlers`): For providing the actual handler functions to be attached to event listeners.

## Core Functions

### `processImageFile(file)`
*   **Purpose:** Handles the loading and display of an image selected via the file input or drag-and-drop.
*   **Parameters:**
    *   `file`: A File object representing the image.
*   **Logic:**
    1.  Checks if the file is a valid image type (starts with `image/`).
    2.  Uses `FileReader` to read the file as a data URL.
    3.  On successful load (`reader.onload`):
        *   Sets `dom.imagePreview.crossOrigin = "Anonymous"`.
        *   Sets `dom.imagePreview.src` to the data URL.
        *   On `dom.imagePreview.onload` (image successfully rendered in `<img>`):
            *   Updates `state.currentImageElement`.
            *   Hides the `uploadCard` and shows the `imagePreviewContainer` and `newUploadButtonExt`.
            *   Calls `canvasManager.resizeCanvasToImage()` to fit the canvas to the new image.
            *   Adds a success comment and updates icon states via `uiManager.updateIconStates()`.
        *   On `dom.imagePreview.onerror`: Adds an error comment and resets the preview.
    4.  On `reader.onerror`: Adds an error comment and resets the preview.
    5.  If the file type is invalid, adds an error comment and resets the preview.

### `processImageUrl(url)`
*   **Purpose:** Handles the loading and display of an image from a given URL (e.g., from drag-and-drop of an image from another website).
*   **Parameters:**
    *   `url`: A string representing the image URL.
*   **Logic:**
    1.  Checks if a URL is provided.
    2.  Sets `dom.imagePreview.crossOrigin = "Anonymous"` (crucial for external URLs to allow canvas operations).
    3.  Sets `dom.imagePreview.src` to the URL.
    4.  On `dom.imagePreview.onload`:
        *   Updates `state.currentImageElement`.
        *   Hides `uploadCard` and shows `imagePreviewContainer` and `newUploadButtonExt`.
        *   Calls `canvasManager.resizeCanvasToImage()`.
        *   Adds a success comment.
        *   **CORS Check:** Attempts to draw the image onto a temporary canvas and get image data. If this fails with a "SecurityError", it means the image is cross-origin and tainted, and MediaPipe might not work. A warning comment is added.
        *   Updates icon states.
    5.  On `dom.imagePreview.onerror`: Adds an error comment and resets the preview.

## Initialization

### `initializeApp()`
*   **Purpose:** The main function called when the application starts. It initializes various components.
*   **Logic:**
    1.  Ensures `dom.canvasCtx` (the 2D canvas context) is available. If not, logs an error and exits.
    2.  Sets `state.drawingUtils` to a new instance of `DrawingUtils` from MediaPipe.
    3.  Calls `uiManager.resetCommonState()` to set the initial UI.
    4.  Attempts to open the IndexedDB database (for model caching) using `utils.openDB()` and stores the DB instance in `state.landmarkDB`. Logs a warning if it fails.
    5.  Calls `mediaPipeManager.initializeFaceLandmarker()` and `mediaPipeManager.initializePoseLandmarker()` to start loading the MediaPipe models (these run asynchronously).
    6.  Adds a "Ready" comment to the UI.
    7.  Calls `setupEventListeners()` to attach all necessary event handlers.

### `setupEventListeners()`
*   **Purpose:** Centralizes the attachment of all event listeners for the application.
*   **Logic:**
    *   Attaches `eventHandlers.handleFileInputChange` to `dom.imageUpload` ('change').
    *   Attaches click handlers from `eventHandlers` to `iconFace`, `iconPose`, `iconGrid`, `iconRestart`, `confirmGridButton`, `cancelModalButton`, `newUploadButtonExt`.
    *   Attaches `eventHandlers.handleModalOverlayClick` to `dom.faceSelectionModal` ('click').
    *   **Canvas Listeners:**
        *   `mousedown`, `mousemove` (on `dom.overlayCanvas`).
        *   `mouseup` (on `window` to catch drags ending outside canvas).
        *   `touchstart`, `touchmove` (on `dom.overlayCanvas`, with `passive: false` to allow `preventDefault`).
        *   `touchend`, `touchcancel` (on `window`).
    *   **Body Drag/Drop Listeners:**
        *   `dragover`, `dragleave`, `drop` (on `dom.bodyElement`).
    *   **Window Resize Listener:**
        *   Attaches a debounced resize handler. When the window is resized, it calls `canvasManager.resizeCanvasToImage()` if an image is loaded.

## Entry Point
*   `initializeApp()` is called at the end of the script, starting the application.

This `main.js` file acts as the glue, bringing together UI interactions, state management, image processing, and the core MediaPipe functionalities.
```
