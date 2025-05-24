# JavaScript File: `js/config.js`

This module centralizes configuration constants used throughout the Sketchit application. This makes it easier to manage and update values that affect various parts of the application's behavior, such as database names, model URLs, and UI interaction parameters.

## Constants

### IndexedDB Configuration

*   **`DB_NAME = 'mediaPipeModelDB'`**
    *   The name of the IndexedDB database used to cache downloaded MediaPipe models.
*   **`DB_VERSION = 1`**
    *   The version of the IndexedDB database. Incrementing this version can trigger database schema upgrades if `onupgradeneeded` is handled in `utils.js`.
*   **`MODEL_STORE_NAME = 'models'`**
    *   The name of the object store within the IndexedDB database where model data is stored.

### MediaPipe Model Keys and URLs

These constants define unique keys for storing models in IndexedDB and the URLs from which to fetch them if they are not cached.

*   **`FACE_MODEL_KEY = 'faceLandmarker_v1'`**
    *   A unique key for the face landmarker model.
*   **`POSE_MODEL_KEY = 'poseLandmarkerHeavy_v1'`**
    *   A unique key for the pose landmarker model (heavy version).
*   **`FACE_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'`**
    *   The URL to download the Face Landmarker model file.
*   **`POSE_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task'`**
    *   The URL to download the Pose Landmarker (heavy) model file.
*   **`MEDIAPIPE_VISION_TASKS_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"`**
    *   The base URL for MediaPipe Vision Tasks WASM files and other resources required by the `@mediapipe/tasks-vision` library.

### UI Interaction Parameters

These constants control the sensitivity and appearance of interactive UI elements on the canvas.

*   **`MIN_GRID_SIZE = 10`**
    *   The minimum size (in pixels) for a manually drawn grid square. Grid selections smaller than this will likely be ignored or disallowed.
*   **`POINT_RADIUS = 5`**
    *   The visual radius (in pixels) for draggable pose landmark points drawn on the canvas.
*   **`HIT_RADIUS = POINT_RADIUS * 1.5`**
    *   The effective radius (in pixels) for detecting clicks or drags on pose landmark points. This is slightly larger than `POINT_RADIUS` to make them easier to interact with.
*   **`HANDLE_SIZE = 10`**
    *   The visual size (in pixels) of the adjustment handles used for resizing the manual grid.
*   **`HANDLE_HIT_RADIUS = HANDLE_SIZE * 1.5`**
    *   The effective radius (in pixels) for detecting clicks or drags on manual grid adjustment handles.

## Usage

These constants are imported by various modules in the application that require these specific values. For example:
*   `utils.js` uses the DB constants for IndexedDB operations.
*   `mediaPipeManager.js` uses the model keys and URLs for initializing MediaPipe landmarkers.
*   `canvasManager.js` and `eventHandlers.js` use UI interaction parameters for drawing and hit detection logic.

Centralizing these values in `config.js` promotes:
*   **Maintainability:** Easy to find and update configuration values.
*   **Consistency:** Ensures all modules use the same values for shared parameters.
*   **Readability:** Makes the code in other modules cleaner by using named constants instead of magic numbers/strings.
