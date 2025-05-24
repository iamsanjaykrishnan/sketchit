# JavaScript File: `js/utils.js`

This module provides a collection of utility functions used across various parts of the Sketchit application. These functions handle tasks like DOM manipulation (adding comments), canvas operations (clearing, getting mouse position), and IndexedDB interactions for model caching.

## Dependencies
*   `./domElements.js` (as `dom`): For accessing DOM elements like the comment area and canvas.
*   `./state.js` (as `state`): For managing state related to UI elements (e.g., `isCommentAreaInitialized`).
*   `./config.js` (as `config`): For configuration constants, primarily for IndexedDB (database name, store name).

## Utility Functions

### DOM & UI Utilities
*   **`addComment(message, type = 'info', username = 'System')`**:
    *   Appends a formatted message to the `dom.commentArea`.
    *   If the comment area hasn't been used yet (contains placeholder text), it clears it first and sets `state.isCommentAreaInitialized = true`.
    *   Creates a `<p>` element containing a username span (`.comment-username`) and a message span (`.comment-<type>`). The `type` (e.g., 'info', 'error', 'success') determines the styling.
    *   Scrolls the comment area to the bottom to show the latest message.
*   **`clearCanvas()`**:
    *   Clears the entire `dom.overlayCanvas` using its 2D context (`dom.canvasCtx`).

### Canvas Utilities
*   **`getMousePos(canvas, evt)`**:
    *   Calculates the mouse or touch position relative to the given `canvas` element.
    *   Handles both mouse events (`evt.clientX/Y`) and touch events (`evt.touches[0].clientX/Y`).
    *   Uses `canvas.getBoundingClientRect()` to get the canvas's position on the page.
    *   Returns an object `{ x, y }`.

### IndexedDB Helper Functions
These functions provide an abstraction layer for interacting with IndexedDB to cache MediaPipe model files.

*   **`openDB(name, version)`**:
    *   Opens (or creates) an IndexedDB database.
    *   **Parameters:**
        *   `name`: Database name (from `config.DB_NAME`).
        *   `version`: Database version (from `config.DB_VERSION`).
    *   **Returns:** A Promise that resolves with the database instance or rejects on error.
    *   **`onupgradeneeded`**: If the database version changes or the DB is created for the first time, this event fires. It creates the object store (defined by `config.MODEL_STORE_NAME`) if it doesn't already exist.
*   **`saveModelToDB(db, modelName, modelData)`**:
    *   Saves model data (typically a Blob) to the specified object store in the database.
    *   **Parameters:**
        *   `db`: The IndexedDB instance.
        *   `modelName`: The key for the model (e.g., `config.FACE_MODEL_KEY`).
        *   `modelData`: The data to store (e.g., a Blob containing the model file).
    *   **Returns:** A Promise that resolves on successful save or rejects on error.
*   **`getModelFromDB(db, modelName)`**:
    *   Retrieves model data from the database.
    *   **Parameters:**
        *   `db`: The IndexedDB instance.
        *   `modelName`: The key for the model.
    *   **Returns:** A Promise that resolves with the model data (e.g., Blob) if found, or `null` if not found. Rejects on error.
*   **`fetchModelBlob(url)`**:
    *   Fetches a model file from a given URL as a Blob.
    *   **Parameters:**
        *   `url`: The URL to download the model from.
    *   **Returns:** A Promise that resolves with the Blob data. Throws an error if the fetch fails.
    *   Adds UI comments for download progress.
*   **`getModelAssetBuffer(db, modelName, modelUrl)`**:
    *   This is a higher-level function used by `mediaPipeManager.js` to obtain a model asset.
    *   **Logic:**
        1.  Tries to get the model (`modelName`) from IndexedDB (`db`) using `getModelFromDB()`.
        2.  If found in DB, adds a "Loading from cache" comment.
        3.  If not found, calls `fetchModelBlob(modelUrl)` to download it.
            *   After successful download, it attempts to save the blob to DB using `saveModelToDB()`.
        4.  Converts the retrieved/downloaded Blob into an `ArrayBuffer` and then a `Uint8Array`, which is the format expected by MediaPipe's `createFromOptions` `modelAssetBuffer`.
        5.  Adds UI comments for status and errors throughout the process.
    *   **Returns:** A Promise that resolves with the `Uint8Array` model buffer or `null` if any step fails.

These utilities are essential for the application's operation, providing reusable functions for common tasks and encapsulating the logic for IndexedDB interactions.
```
