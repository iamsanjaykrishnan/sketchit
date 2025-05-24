# HTML Document: `index.html`

This document outlines the structure and purpose of the `index.html` file for the Sketchit tool.

## Overview

`index.html` serves as the main page for the Sketchit web application. It defines the user interface elements for image uploading, display, and interaction with the MediaPipe library for face and pose detection, and grid overlay.

## Structure

The HTML is organized into standard sections: `<head>` and `<body>`.

### `<head>`

*   **Metadata:**
    *   `charset`: UTF-8
    *   `viewport`: Configured for responsive design (`width=device-width, initial-scale=1.0`).
*   **Title:** "Sketchit a tool to study proportions"
*   **External Resources:**
    *   **Tailwind CSS:** Loaded via CDN for utility-first styling.
    *   **Google Fonts:**
        *   "Inter" font family.
        *   "Material Symbols Outlined" for icons.
    *   **Local Stylesheet:** Links to `./css/style.css` for custom styles.

### `<body>`

The body is styled with a gray background (`bg-gray-100`) and uses flexbox to center content.

*   **Drop Indicator (`<div class="drop-indicator">`):**
    *   A visual cue for drag-and-drop image functionality. Initially hidden, likely shown during drag events.
    *   Contains text: "Drop image here".

*   **Main Content Wrapper (`<div class="w-full max-w-md ...">`):**
    *   A centered column holding all primary UI elements.

    *   **Upload Card (`<label id="uploadCard" for="imageUpload" ...>`):**
        *   The initial view for users to upload an image.
        *   Contains:
            *   Application title "Sketchit" and a brief description of its functionality (using MediaPipe for face/pose detection and grid overlay for artists).
            *   A "dashed-zone" acting as a clickable area for file upload, with an icon and text ("Click to upload", "or drag and drop an image").
        *   Associated with the file input `<input type="file" id="imageUpload">`.

    *   **File Input (`<input type="file" id="imageUpload" accept="image/*">`):**
        *   Standard HTML file input, hidden by default and triggered by the `uploadCard`.
        *   Accepts only image files.

    *   **New Upload Button (`<button id="newUploadButtonExt" class="hidden">`):**
        *   A button to upload a new image, likely becomes visible after an image is already processed.
        *   Contains an upload icon and text "Upload New Image".

    *   **Image Preview Container (`<div id="imagePreviewContainer" ...>`):**
        *   A card that appears after an image is selected, for displaying the image and interaction controls. Initially hidden.
        *   **Header:** Displays "sketchit" and a user icon.
        *   **Image Display Area (`<div class="relative">`):**
            *   `image-display-container`: Holds the image and canvas.
                *   `<img id="imagePreview" src="#" alt="Image Preview">`: Displays the uploaded image.
                *   `<canvas id="overlayCanvas"></canvas>`: Used to draw overlays (grids, landmarks) on top of the image.
                *   `<div id="placeholderText" ...>`: Text shown if no image is selected (e.g., "Select an image to preview").
            *   `<div id="adjustmentHandlesContainer" ...>`: Likely for manual adjustment handles for the grid or other elements.
            *   `<button id="confirmGridButton" ...>`: Allows the user to confirm a manually drawn or adjusted grid. Initially hidden and disabled.
        *   **Controls Footer (`<div class="p-3 border-t ...">`):**
            *   Icons for toggling features:
                *   `iconFace`: Toggle Face Landmarks.
                *   `iconPose`: Toggle Pose Landmarks.
                *   `iconGrid`: Manually Draw Grid Square.
                *   `iconRestart`: Clear All Overlays & Data.
            *   **Comment Area (`<div id="commentArea">`):**
                *   Displays system messages or information (e.g., "Initializing MediaPipe...").

    *   **Privacy Policy Card (`<div id="privacyPolicyCard" ...>`):**
        *   Displays privacy notes and terms of use.
        *   Mentions that images are processed in the browser via MediaPipe.
        *   Links to MediaPipe Terms of Service.
        *   States that uploading an image implies agreement to terms.

*   **Face Selection Modal (`<div id="faceSelectionModal" class="modal-overlay">`):**
    *   A modal dialog that appears if multiple faces are detected in the uploaded image.
    *   **Content (`<div class="modal-content">`):**
        *   Title: "Select Reference Face".
        *   Body text: Explains the need to select one face.
        *   `<div id="modalFaceButtons" ...>`: Container for buttons, where each button likely corresponds to a detected face.
        *   `<button id="cancelModalButton" class="cancel-btn">`: Allows canceling the selection.

*   **Scripts:**
    *   `<script type="module" src="js/main.js"></script>`: Loads the main JavaScript module, which likely orchestrates the application's logic and imports other necessary JS files.

## Purpose and Functionality

The HTML file sets up the entire front-end structure for an image processing tool. Key functionalities facilitated by this structure include:

*   Image uploading (click or drag-and-drop).
*   Image preview.
*   Overlaying a canvas for drawing (grids, landmarks).
*   Controls for interacting with MediaPipe features (face/pose detection, grid drawing).
*   A modal for disambiguating when multiple faces are detected.
*   Displaying privacy information and terms.

It relies heavily on JavaScript (loaded via `js/main.js`) for dynamic behavior and interaction, and uses Tailwind CSS and custom CSS for styling.
