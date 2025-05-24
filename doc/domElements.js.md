# JavaScript File: `js/domElements.js`

This module serves as a centralized repository for frequently accessed DOM elements. Caching these elements here avoids repeated `document.getElementById()` calls throughout the application, potentially improving performance and making the code cleaner.

## Purpose

The primary goal is to query the DOM once for each essential element and then export these references for other modules to import and use directly.

## Exported DOM Element References

All listed elements are obtained using `document.getElementById('elementId')`.

*   **`imageUpload`**: The hidden file input element (`<input type="file" id="imageUpload">`) used for selecting images.
*   **`imagePreviewContainer`**: The container (`<div id="imagePreviewContainer">`) that holds the image preview, canvas, and related controls. It's shown after an image is loaded.
*   **`imagePreview`**: The `<img>` tag (`<img id="imagePreview">`) where the uploaded image is displayed.
*   **`placeholderText`**: A `<div>` (`<div id="placeholderText">`) that might show text like "Select an image to preview" when no image is loaded in the preview area.
*   **`commentArea`**: The `<div>` (`<div id="commentArea">`) used to display system messages, logs, and feedback to the user.
*   **`iconFace`**: The icon element (`<span id="iconFace">`) for toggling face landmarks.
*   **`iconPose`**: The icon element (`<span id="iconPose">`) for toggling pose landmarks.
*   **`iconGrid`**: The icon element (`<span id="iconGrid">`) for activating manual grid drawing mode.
*   **`iconRestart`**: The icon element (`<span id="iconRestart">`) for clearing overlays and data.
*   **`overlayCanvas`**: The `<canvas>` element (`<canvas id="overlayCanvas">`) used for drawing landmarks and grids over the image.
*   **`canvasCtx`**: The 2D rendering context of the `overlayCanvas` (`overlayCanvas.getContext('2d')`). This is `null` if the canvas element itself isn't found.
*   **`faceSelectionModal`**: The main container element (`<div id="faceSelectionModal">`) for the modal dialog that allows users to select a reference face when multiple faces are detected.
*   **`modalFaceButtons`**: The `<div>` (`<div id="modalFaceButtons">`) inside the face selection modal where buttons for each detected face are dynamically added.
*   **`cancelModalButton`**: The button (`<button id="cancelModalButton">`) within the face selection modal to close it.
*   **`adjustmentHandlesContainer`**: The `<div>` (`<div id="adjustmentHandlesContainer">`) that holds the draggable handles for adjusting the manual grid. This container is positioned over the canvas.
*   **`confirmGridButton`**: The button (`<button id="confirmGridButton">`) used to confirm the manually drawn/adjusted grid.
*   **`bodyElement`**: A reference to the `document.body` element, used for global event listeners like drag-and-drop.
*   **`uploadCard`**: The initial card (`<label id="uploadCard">`) that prompts users to upload an image.
*   **`newUploadButtonExt`**: An external "Upload New Image" button (`<button id="newUploadButtonExt">`) that appears after an image has been loaded, offering a way to upload a different image.

## Usage

Other modules (e.g., `eventHandlers.js`, `uiManager.js`, `canvasManager.js`, `main.js`) import these constants to interact with the DOM.

Example:
```javascript
// In another module, e.g., uiManager.js
import * as dom from './domElements.js';

function showImagePreview() {
    if (dom.imagePreviewContainer) {
        dom.imagePreviewContainer.classList.remove('hidden');
    }
    if (dom.uploadCard) {
        dom.uploadCard.classList.add('hidden');
    }
}
```

This approach helps in:
*   **Reducing Redundancy:** DOM queries are not scattered across multiple files.
*   **Performance:** Minimizes repeated DOM lookups, though the benefit might be marginal for a small number of elements.
*   **Maintainability:** If an ID changes in the HTML, it only needs to be updated in this one file.
```
