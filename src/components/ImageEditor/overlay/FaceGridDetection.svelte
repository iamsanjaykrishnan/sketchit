<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
  
    export let imageElement: HTMLImageElement;
    export let faceLandmarker: any;
    export let DrawingUtils: any;
    export let FaceLandmarkerClass: any;
  
    let faceCanvas: HTMLCanvasElement | null = null;
  
  
  
    function handleResize() {
    if (!faceCanvas || !imageElement) return;
      const { width, height } = imageElement.getBoundingClientRect();
      faceCanvas.style.width = `${width}px`;
      faceCanvas.style.height = `${height}px`;
    }
  
    async function detectFaceLandmarks() {
      if (!faceLandmarker) {
        console.error('FaceLandmarker is not initialized.');
        return;
      }
  
      const canvasCtx = faceCanvas.getContext('2d');
      if (!canvasCtx) {
        console.error('Failed to get face canvas context.');
        return;
      }
  
      handleResize();
      window.removeEventListener('resize', handleResize);
      window.addEventListener('resize', handleResize);
  
      try {
			// Detect face landmarks synchronously
			const result = faceLandmarker.detect(imageElement);
			canvasCtx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);

			if (result.faceLandmarks && result.faceLandmarks.length > 0) {
				const drawingUtils = new DrawingUtils(canvasCtx);

				for (const landmarks of result.faceLandmarks) {
					// Draw existing face landmarks
					drawingUtils.drawConnectors(landmarks, FaceLandmarkerClass.FACE_LANDMARKS_RIGHT_EYE, {
						color: '#FF3030',
						lineWidth: 1
					});
					drawingUtils.drawConnectors(landmarks, FaceLandmarkerClass.FACE_LANDMARKS_RIGHT_EYEBROW, {
						color: '#FF3030',
						lineWidth: 1
					});
					drawingUtils.drawConnectors(landmarks, FaceLandmarkerClass.FACE_LANDMARKS_LEFT_EYE, {
						color: '#30FF30',
						lineWidth: 1
					});
					drawingUtils.drawConnectors(landmarks, FaceLandmarkerClass.FACE_LANDMARKS_LEFT_EYEBROW, {
						color: '#30FF30',
						lineWidth: 1
					});
					drawingUtils.drawConnectors(landmarks, FaceLandmarkerClass.FACE_LANDMARKS_FACE_OVAL, {
						color: '#E0E0E0',
						lineWidth: 1
					});
					drawingUtils.drawConnectors(landmarks, FaceLandmarkerClass.FACE_LANDMARKS_LIPS, {
						color: '#E0E0E0',
						lineWidth: 1
					});
					drawingUtils.drawConnectors(landmarks, FaceLandmarkerClass.FACE_LANDMARKS_RIGHT_IRIS, {
						color: '#FF3030',
						lineWidth: 1
					});
					drawingUtils.drawConnectors(landmarks, FaceLandmarkerClass.FACE_LANDMARKS_LEFT_IRIS, {
						color: '#30FF30',
						lineWidth: 1
					});

					// === Add Grid Lines Within the Bounding Box ===

					// Convert normalized landmarks to pixel coordinates
					const pixelLandmarks = landmarks.map((point: any) => ({
						x: point.x * faceCanvas.width,
						y: point.y * faceCanvas.height
					}));
					// Define key landmarks for grid lines
					const chinPoint = pixelLandmarks[152]; // Chin
					const foreheadPoint = pixelLandmarks[10]; // Forehead (approximate)
					const leftCheek = pixelLandmarks[234]; // Left cheek
					const rightCheek = pixelLandmarks[454]; // Right cheek


					// Calculate head height
					const headHeight = chinPoint.y - foreheadPoint.y;

					// Calculate horizontal grid lines
					const horizontalLines = [];

					// Add lines below the chin till the bottom of the image
					let currentY = chinPoint.y;
					while (currentY < faceCanvas.height) {
						horizontalLines.push(currentY);
						currentY += headHeight;
					}

					// Add lines above the forehead till the top of the image
					currentY = foreheadPoint.y;
					while (currentY > 0) {
						horizontalLines.push(currentY);
						currentY -= headHeight;
					}

					// Draw horizontal grid lines
					canvasCtx.strokeStyle = 'rgba(255, 255, 0, 0.8)'; // Yellow color
					canvasCtx.lineWidth = 1;
					horizontalLines.forEach((y) => {
						canvasCtx.beginPath();
						canvasCtx.moveTo(0, y);
						canvasCtx.lineTo(faceCanvas.width, y);
						canvasCtx.stroke();
					});

					// Calculate vertical grid lines
					const verticalLines = [];
					const faceMid = (leftCheek.x + rightCheek.x) / 2;
					const leftRef = faceMid - headHeight / 2;

					// Add lines to the right of the left reference till the right edge of the image
					let currentX = leftRef;
					while (currentX < faceCanvas.width) {
						verticalLines.push(currentX);
						currentX += headHeight;
					}

					// Add lines to the left of the left reference till the left edge of the image
					currentX = leftRef;
					while (currentX > 0) {
						verticalLines.push(currentX);
						currentX -= headHeight;
					}

					// Draw vertical grid lines
					canvasCtx.strokeStyle = 'rgba(0, 255, 255, 0.8)'; // Cyan color for better visibility
					verticalLines.forEach((x) => {
						canvasCtx.beginPath();
						canvasCtx.moveTo(x, 0);
						canvasCtx.lineTo(x, faceCanvas.height);
						canvasCtx.stroke();
					});

                    
					// Calculate the bounding box of the face landmarks
					const minX = leftRef;
					const maxX = leftRef + headHeight;
					const minY = foreheadPoint.y+headHeight;
					const maxY = foreheadPoint.y;

					const boxWidth = maxX - minX;
					const boxHeight = maxY - minY;

					// Calculate positions for three equally spaced horizontal lines within the bounding box
					const horizontalFaceLines = [minY + boxHeight / 3, minY + (2 * boxHeight) / 3];

					// Calculate positions for three equally spaced vertical lines within the bounding box
					const verticalFaceLines = [minX + boxWidth / 3, minX + (2 * boxWidth) / 3];

					// Draw horizontal grid lines within the bounding box
					canvasCtx.strokeStyle = 'rgba(255, 255, 0, 0.8)'; // Yellow color
					canvasCtx.lineWidth = 1;
					horizontalFaceLines.forEach((y) => {
						canvasCtx.beginPath();
						canvasCtx.moveTo(minX, y);
						canvasCtx.lineTo(maxX, y);
						canvasCtx.stroke();
					});

					// Draw vertical grid lines within the bounding box
					canvasCtx.strokeStyle = 'rgba(0, 255, 255, 0.8)'; // Cyan color
					verticalFaceLines.forEach((x) => {
						canvasCtx.beginPath();
						canvasCtx.moveTo(x, minY);
						canvasCtx.lineTo(x, maxY);
						canvasCtx.stroke();
					});
				}

				console.log('Face landmarks and grid lines within bounding box drawn.');
			} else {
				console.log('No face landmarks detected.');
			}
		} catch (error) {
			console.error('Error detecting face landmarks:', error);
		}
    }
  
    onMount(() => {
    if (faceCanvas) {
        faceCanvas.width = imageElement.naturalWidth;
        faceCanvas.height = imageElement.naturalHeight;
    }
      detectFaceLandmarks();
    });
  
    onDestroy(() => {
      window.removeEventListener('resize', handleResize);
    });
  </script>
  
  <canvas bind:this={faceCanvas} class="overlay-canvas"></canvas>
  
  <style>
    .overlay-canvas {
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: none;
      width: 100%;
      height: 100%;
      z-index: 20;
    }
  </style>
  