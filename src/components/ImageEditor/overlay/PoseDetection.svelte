<script lang="ts">
    import { onMount, onDestroy } from 'svelte';

    export let imageElement: HTMLImageElement;
    export let poseLandmarker: any;
    export let DrawingUtils: any;
    export let PoseLandmarkerClass: any;

    let poseCanvas: HTMLCanvasElement | null = null;
    let landmarks: Array<Array<{ x: number; y: number; z: number }>> = [];
    let originalLandmarks: Array<Array<{ x: number; y: number; z: number }>> = [];

    // Variables for dragging
    let isDragging = false;
    let draggedPointIndex: number | null = null;
    let draggedLandmarkIndex: number | null = null;

    // Handle window resize to adjust canvas size
    function handleResize() {
        if (!poseCanvas || !imageElement) return;
        const { width, height } = imageElement.getBoundingClientRect();

        poseCanvas.width = imageElement.naturalWidth;
        poseCanvas.height = imageElement.naturalHeight;

        // Adjust canvas display size
        poseCanvas.style.width = `${width}px`;
        poseCanvas.style.height = `${height}px`;

        // Redraw landmarks after resizing
        drawLandmarks();
    }

    // Detect pose and update landmarks
    async function detectPose() {
        if (!poseLandmarker) {
            console.error('PoseLandmarker is not initialized.');
            return;
        }

        handleResize();
        window.removeEventListener('resize', handleResize);
        window.addEventListener('resize', handleResize);

        try {
            const result = await poseLandmarker.detect(imageElement);

            if (result.landmarks && result.landmarks.length > 0) {
                // Deep copy to avoid mutating original data
                landmarks = result.landmarks.map(person =>
                    person.map(point => ({ x: point.x, y: point.y, z: point.z }))
                );
                originalLandmarks = JSON.parse(JSON.stringify(landmarks)); // Store original landmarks for resetting
                drawLandmarks();
            }
        } catch (error) {
            console.error('Error during pose detection:', error);
        }
    }

    // Draw landmarks and connectors on the canvas
    function drawLandmarks() {
        if (!poseCanvas) return;
        const canvasCtx = poseCanvas.getContext('2d');
        if (!canvasCtx) return;

        // Clear the canvas
        canvasCtx.clearRect(0, 0, poseCanvas.width, poseCanvas.height);

        if (landmarks.length > 0) {
            const drawingUtils = new DrawingUtils(canvasCtx);
            const leftColor = '#FF6F61';
            const rightColor = '#1E90FF';
            const lineColor = '#FFFFFF';

            landmarks.forEach(personLandmarks => {
                personLandmarks.forEach((point, i) => {
                    const isLeftSide = i % 2 === 0;
                    drawingUtils.drawLandmarks([point], {
                        radius: 5,
                        color: isLeftSide ? leftColor : rightColor,
                    });
                });

                drawingUtils.drawConnectors(
                    personLandmarks,
                    PoseLandmarkerClass.POSE_CONNECTIONS,
                    {
                        color: lineColor,
                        lineWidth: 4,
                    }
                );
            });
        }
    }

    // Convert mouse event coordinates to normalized canvas coordinates
    function getNormalizedCoordinates(event: MouseEvent): { x: number; y: number } {
        if (!poseCanvas) return { x: 0, y: 0 };
        const rect = poseCanvas.getBoundingClientRect();
        
        // Use the actual dimensions from bounding rect for accuracy
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        
        return { x, y };
    }

    // Handle mouse down event to initiate dragging
    function onMouseDown(event: MouseEvent) {
        if (!poseCanvas) return;

        const rect = poseCanvas.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width; // Use normalized x
        const y = (event.clientY - rect.top) / rect.height; // Use normalized y
        console.log("onMouseDown:", x, ",", y);

        let closestDistance = Infinity;
        let closestPointIndex: number | null = null;
        let closestLandmarkIndex: number | null = null;

        // Iterate through all landmarks to find the closest one
        for (let p = 0; p < landmarks.length; p++) { // For each person
            for (let i = 0; i < landmarks[p].length; i++) { // For each landmark
                const point = landmarks[p][i];
                
                const dx = (x - point.x);
                const dy = (y - point.y);
                const distance = Math.sqrt(dx * dx + dy * dy);
                console.log("landmark:", i, "x;", point.x," y:",point.y," dx:",dx," dy",dy," distance",distance);

                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestPointIndex = i;
                    closestLandmarkIndex = p;
                }
            }
        }

        // If the closest distance is within a reasonable threshold, start dragging
        if (closestDistance < 0.05 && closestPointIndex !== null && closestLandmarkIndex !== null) {
            isDragging = true;
            draggedPointIndex = closestPointIndex;
            draggedLandmarkIndex = closestLandmarkIndex;

            // Add dragging class for cursor change
            poseCanvas.classList.add('dragging');
        }
    }

    // Handle mouse move event to drag the selected landmark
    function onMouseMove(event: MouseEvent) {
        if (!isDragging || draggedPointIndex === null || draggedLandmarkIndex === null) return;

        const { x, y } = getNormalizedCoordinates(event);

        // Clamp values between 0 and 1
        const clampedX = Math.max(0, Math.min(1, x));
        const clampedY = Math.max(0, Math.min(1, y));

        // Update the position of the dragged landmark
        landmarks[draggedLandmarkIndex][draggedPointIndex] = { x: clampedX, y: clampedY, z: 0 };

        drawLandmarks();
    }

    // Handle mouse up event to end dragging
    function onMouseUp() {
        if (isDragging && poseCanvas) {
            // Remove dragging class
            poseCanvas.classList.remove('dragging');
        }
        isDragging = false;
        draggedPointIndex = null;
        draggedLandmarkIndex = null;
        console.log("onMouseUp");
    }

    // Handle double click event to reset landmark position
    function onDoubleClick(event: MouseEvent) {
        if (!poseCanvas) return;

        const { x, y } = getNormalizedCoordinates(event);
        console.log("onDoubleClick:", x, ",", y);

        let closestDistance = Infinity;
        let closestPointIndex: number | null = null;
        let closestLandmarkIndex: number | null = null;

        // Iterate through all landmarks to find the closest one
        for (let p = 0; p < landmarks.length; p++) { // For each person
            for (let i = 0; i < landmarks[p].length; i++) { // For each landmark
                const point = landmarks[p][i];
                const dx = (x - point.x);
                const dy = (y - point.y);
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestPointIndex = i;
                    closestLandmarkIndex = p;
                }
            }
        }

        // If the closest distance is within a reasonable threshold, reset the position of that landmark
        if (closestDistance < 0.05 && closestPointIndex !== null && closestLandmarkIndex !== null) {
            landmarks[closestLandmarkIndex][closestPointIndex] = { ...originalLandmarks[closestLandmarkIndex][closestPointIndex] };
            drawLandmarks();
        }
    }

    // Setup initial canvas properties
    function setupCanvas() {
        if (!poseCanvas || !imageElement) return;
        const { width, height } = imageElement.getBoundingClientRect();

        // Set canvas dimensions
        poseCanvas.width = imageElement.naturalWidth;
        poseCanvas.height = imageElement.naturalHeight;

        // Set canvas display size
        poseCanvas.style.width = `${width}px`;
        poseCanvas.style.height = `${height}px`;

        // Initial drawing
        drawLandmarks();
    }

    onMount(() => {
        if (poseCanvas) {
            // Setup canvas size and properties
            setupCanvas();

            // Attach event listeners
            poseCanvas.addEventListener('mousedown', onMouseDown);
            poseCanvas.addEventListener('mousemove', onMouseMove);
            poseCanvas.addEventListener('dblclick', (event) => {
                event.stopPropagation(); // Prevent the image from being selected
                onDoubleClick(event);
            });
            window.addEventListener('mouseup', onMouseUp);
        }
        detectPose();
    });

    onDestroy(() => {
        window.removeEventListener('resize', handleResize);
        if (poseCanvas) {
            poseCanvas.removeEventListener('mousedown', onMouseDown);
            poseCanvas.removeEventListener('mousemove', onMouseMove);
            poseCanvas.removeEventListener('dblclick', onDoubleClick);
        }
        window.removeEventListener('mouseup', onMouseUp);
    });
</script>

<canvas bind:this={poseCanvas} class="overlay-canvas"></canvas>

<style>
    .overlay-canvas {
        position: absolute;
        top: 0;
        left: 0;
        /* Removed pointer-events: none; to allow interaction */
        width: 100%;
        height: 100%;
        z-index: 10;
        cursor: default; /* Set default cursor */
    }

    /* Change cursor when dragging */
    .overlay-canvas.dragging {
        cursor: grabbing;
    }
</style>