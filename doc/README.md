# Sketchit Application Documentation

This folder contains documentation for the Sketchit web application.

## Markdown Documents

*   **`index.md`**: Describes the structure and purpose of the main `index.html` file.
*   **`style.md`**: Describes the custom styles in `css/style.css`.
*   **`canvasManager.js.md`**: Documentation for `js/canvasManager.js` (manages canvas drawing and resizing).
*   **`config.js.md`**: Documentation for `js/config.js` (application configuration constants).
*   **`domElements.js.md`**: Documentation for `js/domElements.js` (centralized DOM element access).
*   **`eventHandlers.js.md`**: Documentation for `js/eventHandlers.js` (handles user interactions and events).
*   **`main.js.md`**: Documentation for `js/main.js` (main application entry point and orchestration).
*   **`mediaPipeManager.js.md`**: Documentation for `js/mediaPipeManager.js` (manages MediaPipe model loading and execution).
*   **`state.js.md`**: Documentation for `js/state.js` (global application state management).
*   **`uiManager.js.md`**: Documentation for `js/uiManager.js` (handles UI updates, modals, and visual states).
*   **`utils.js.md`**: Documentation for `js/utils.js` (utility functions).

## PlantUML Diagrams

*   **`components.puml`**: A component diagram showing the relationships between different JavaScript modules and external libraries.
    *   To view this diagram, you can use a PlantUML renderer (e.g., online viewers like PlantText, or local tools).
*   **`image_processing_flow.puml`**: An activity diagram illustrating the flow from user image input to display and readiness for processing.
*   **`manual_grid_flow.puml`**: An activity diagram showing the user and system interactions for drawing, adjusting, and confirming a manual grid.
*   **`face_detection_flow.puml`**: An activity diagram detailing the face detection process, including selection from multiple detected faces.
*   **`pose_detection_flow.puml`**: An activity diagram covering pose detection and the subsequent interaction for dragging pose landmarks.

*(More diagrams may be added here as they are created.)*
