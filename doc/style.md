# CSS Stylesheet: `css/style.css`

This document outlines the purpose and structure of the `style.css` file, which provides custom styling for the Sketchit web application, complementing the Tailwind CSS framework.

## General Styles

*   **Font:**
    *   Applies the 'Inter' font family globally to the `body`.
    *   Includes a smooth transition for `background-color` changes.
*   **Dragover State:**
    *   When a drag operation is active over the `body` (`body.dragover`), the background color changes to a light blue (`#e0f2fe`), providing visual feedback.

## Drop Indicator (`.drop-indicator`)

*   **Purpose:** Provides a full-screen visual cue when a file is being dragged over the window, indicating a droppable area.
*   **Styling:**
    *   Fixed position, covering the entire viewport.
    *   Dashed border (`#3b82f6`) and a semi-transparent background (`rgba(59, 130, 246, 0.1)`).
    *   High `z-index` (9999) to appear above other content.
    *   Uses flexbox to center its text content.
    *   Initially hidden (`opacity: 0`, `visibility: hidden`) and `pointer-events: none`.
    *   Becomes visible (`opacity: 1`, `visibility: visible`) when `body.dragover` class is active.
*   **Text (`.drop-indicator-text`):**
    *   Large font size, bold weight, and a distinct color.
    *   Styled with a semi-transparent white background and rounded corners for readability.

## File Input (`#imageUpload`)

*   The default HTML file input is hidden (`display: none`), as its functionality is triggered by a custom-styled label (`uploadCard` in `index.html`).

## Display Card (`.display-card`)

*   Sets a `max-width` of 480px and `width: 100%` for the main card that shows the image and controls, ensuring responsiveness.

## Image Display Container (`.image-display-container`)

*   **Purpose:** Holds the uploaded image and the overlay canvas.
*   **Styling:**
    *   Relative positioning to act as a container for the absolutely positioned canvas.
    *   Light gray background (`#f3f4f6`).
    *   Uses flexbox to center the image.
    *   `overflow: hidden` to contain the image/canvas.
    *   `aspect-ratio: 1 / 1` to maintain a square shape, suitable for image previews.
    *   `max-height: 600px`.
*   **Image (`.display-card img#imagePreview`):**
    *   Ensures the image is displayed as a block, fits within the container (`max-width: 100%`, `max-height: 100%`), and maintains its aspect ratio (`object-fit: contain`).

## Overlay Canvas (`#overlayCanvas`)

*   **Purpose:** Used for drawing grids, landmarks, and other visual aids over the image.
*   **Styling:**
    *   Absolutely positioned to cover the `image-display-container` completely.
    *   Default cursor; `touch-action: none` to prevent default touch behaviors that might interfere with custom interactions.
*   **Cursor States:**
    *   Changes cursor style based on the current drawing/interaction mode (e.g., `crosshair` for grid drawing, `grab` for dragging points/handles, `move` for dragging the grid square). These states are likely toggled via JavaScript by adding classes like `.manual-grid-drawing`, `.dragging-pose`, etc.

## Material Symbols Outlined (`.material-symbols-outlined`)

*   **Purpose:** Styles for the icons used throughout the application.
*   **Styling:**
    *   Vertical alignment, font size, default cursor (`pointer`).
    *   Transition for color changes.
    *   `display: inline-block`, `line-height: 1`.
*   **States:**
    *   `.active`: Changes color to blue (`#3b82f6`) when an icon/feature is active.
    *   `.disabled`: Reduces opacity, changes color to gray (`#6b7280`), and sets `cursor: not-allowed`.
    *   Handles combined states like `.disabled.active`.

## Comment Area (`#commentArea`)

*   **Purpose:** Displays system messages, errors, or logs.
*   **Styling:**
    *   `max-height: 100px` with `overflow-y: auto` for scrollable content.
    *   Basic typography and color.
*   **Message Types:**
    *   `.comment-username`: Styles for the username/source of the message (e.g., "System").
    *   `.comment-error`, `.comment-success`, `.comment-info`, `.comment-warning`: Specific text colors for different types of messages.

## Modal Styling (`.modal-overlay`, `.modal-content`, etc.)

*   **Purpose:** Styles for the pop-up modal (e.g., face selection modal).
*   **Overlay (`.modal-overlay`):**
    *   Fixed position, full viewport coverage with a semi-transparent black background (`rgba(0, 0, 0, 0.6)`).
    *   Uses flexbox to center modal content.
    *   High `z-index` (1000).
    *   Transitions for `opacity` and `visibility` for smooth appearance/disappearance.
    *   Controlled by the `.visible` class.
*   **Content (`.modal-content`):**
    *   White background, padding, rounded corners, and shadow.
    *   `max-width: 90%`, `width: 350px`, centered text.
*   **Title (`.modal-title`), Body (`.modal-body`), Actions (`.modal-actions`):**
    *   Basic typography and spacing for modal elements.
*   **Buttons (`.select-face-btn`, `.cancel-btn`):**
    *   Specific styling for buttons within the modal, including background colors, text colors, and hover effects.

## Adjustment Handles (`.adjustment-handle`)

*   **Purpose:** Visual handles for manipulating elements (e.g., grid lines).
*   **Styling:**
    *   Absolutely positioned, small magenta circles/squares with a border.
    *   `cursor: grab`.
    *   `transform: translate(-50%, -50%)` for precise centering on a point.
    *   `z-index: 10`.
    *   `pointer-events: none` by default, but enabled (`pointer-events: auto`) when the canvas is in `.manual-grid-adjusting` mode.
    *   Slightly different `border-radius` for handles intended for lines vs. corners/points.

## Confirm Grid Button (`#confirmGridButton`)

*   Smooth transitions for `opacity` and `visibility`.

## Upload Card Styling (`#uploadCard`)

*   **Purpose:** Provides an attractive and engaging initial upload area.
*   **Styling:**
    *   Uses a linear gradient background (purple to pink).
    *   Transitions for `box-shadow` and `transform` for a subtle hover effect (`transform: translateY(-2px)`).
    *   White text color for title (`h2`) and lighter shades for paragraph text, with text shadows for readability.
*   **Dashed Zone (`#uploadCard .dashed-zone`):**
    *   Inner area for drag-and-drop, styled with a dashed border and semi-transparent background.
    *   Hover effects to make it more prominent.
    *   Styles for the icon and text within this zone, ensuring they are visible against the gradient background.

## External New Upload Button (`#newUploadButtonExt`)

*   **Purpose:** A button, likely shown after an initial upload, to allow uploading another image.
*   **Styling:**
    *   `display: none` by default, shown as `inline-flex` when not hidden (via `.hidden` class removal by JS).
    *   Styled with padding, rounded corners, box shadow, and a solid background color (`#4f46e5`).
    *   Hover and focus states for interactivity.
    *   Includes styling for an embedded Material Symbol icon.

## Privacy/Terms Policy Card (`.policy-card`)

*   **Purpose:** Styles the card displaying privacy and terms information.
*   **Styling:**
    *   Matches the `max-width` of other cards (480px).
    *   Slightly off-white background (`#f9fafb`) and a soft border.
    *   Margin at the top for spacing.

## Summary

`style.css` provides essential custom styles that define the application's look and feel, especially for interactive elements, states (like dragover, disabled icons), and custom components like the modal and upload card. It works in conjunction with Tailwind CSS, overriding or supplementing its utility classes where necessary to achieve a specific design.
