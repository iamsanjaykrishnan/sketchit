<script lang="ts">
	import { faTimes, faMagicWandSparkles, faBorderAll } from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { onMount, onDestroy } from 'svelte';

	export let url: string;
	export let index: number;
	export let removeImage: () => void;

	let poseLandmarker: any;
	let faceLandmarker: any;
	let poseCanvas: HTMLCanvasElement | null = null;
	let faceCanvas: HTMLCanvasElement | null = null;
	let imageElement: HTMLImageElement;
	let DrawingUtils: any;
	let PoseLandmarkerClass: any;
	let FaceLandmarkerClass: any;
	let poseVisible = false;
	let faceVisible = false; // Renamed from maskVisible for clarity
	let landmarkersInitialized = false;
	let initializationError = '';

	// Function to initialize PoseLandmarker and FaceLandmarker
	async function initializeLandmarkers() {
		try {
			const vision = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3');
			PoseLandmarkerClass = vision.PoseLandmarker;
			FaceLandmarkerClass = vision.FaceLandmarker;
			DrawingUtils = vision.DrawingUtils;
			const FilesetResolver = vision.FilesetResolver;

			const filesetResolver = await FilesetResolver.forVisionTasks(
				'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
			);

			poseLandmarker = await PoseLandmarkerClass.createFromOptions(filesetResolver, {
				baseOptions: {
					modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/latest/pose_landmarker_heavy.task`,
					delegate: 'GPU'
				},
				runningMode: 'IMAGE',
				numPoses: 1
			});

			faceLandmarker = await FaceLandmarkerClass.createFromOptions(filesetResolver, {
				baseOptions: {
					modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
					delegate: 'GPU'
				},
				outputFaceBlendshapes: false,
				runningMode: 'IMAGE',
				numFaces: 1
			});

			console.log('Landmarkers initialized successfully.');
			landmarkersInitialized = true;
		} catch (error) {
			console.error('Error initializing landmarkers:', error);
			initializationError = 'Failed to initialize landmarkers. Please try again later.';
		}
	}

	// Function to create and append a canvas overlay
	function createCanvasOverlay(type: 'pose' | 'face') {
		let canvas = type === 'pose' ? poseCanvas : faceCanvas;
		if (canvas) return; // Canvas already exists

		canvas = document.createElement('canvas');
		canvas.width = imageElement.naturalWidth;
		canvas.height = imageElement.naturalHeight;
		canvas.style.position = 'absolute';
		canvas.style.top = '0';
		canvas.style.left = '0';
		canvas.style.width = '100%';
		canvas.style.height = '100%';
		canvas.style.pointerEvents = 'none';
		canvas.style.zIndex = type === 'pose' ? '10' : '20'; // Different z-index for layering

		imageElement.parentNode?.appendChild(canvas);

		if (type === 'pose') {
			poseCanvas = canvas;
		} else {
			faceCanvas = canvas;
		}
	}

	// Function to resize the canvases to match the image's displayed size
	function resizeCanvas() {
		const canvases = [poseCanvas, faceCanvas];
		canvases.forEach((canvas) => {
			if (!canvas || !imageElement) {
				return;
			}
			const { width, height } = imageElement.getBoundingClientRect();
			canvas.style.width = `${width}px`;
			canvas.style.height = `${height}px`;
		});
	}

	// Unified resize handler
	function handleResize() {
		resizeCanvas();
	}

	// Pose Detection Function
	async function detectPose() {
		console.log('Pose detection toggled');
		if (poseVisible) {
			// Remove the pose overlay if it's currently visible
			if (poseCanvas) {
				poseCanvas.remove();
				poseCanvas = null;
			}
			poseVisible = false;
			return;
		}

		if (!landmarkersInitialized) {
			console.error('Landmarkers are not initialized yet.');
			return;
		}

		if (!poseLandmarker) {
			console.error('PoseLandmarker is not initialized.');
			return;
		}

		// Create a new canvas for drawing pose
		createCanvasOverlay('pose');
		if (!poseCanvas) {
			console.error('Failed to create pose canvas overlay.');
			return;
		}

		const canvasCtx = poseCanvas.getContext('2d');
		if (!canvasCtx) {
			console.error('Failed to get pose canvas context.');
			return;
		}

		resizeCanvas();
		// Ensure only one resize listener is added
		window.removeEventListener('resize', handleResize);
		window.addEventListener('resize', handleResize);

		try {
			// Detect pose synchronously
			const result = poseLandmarker.detect(imageElement);
			canvasCtx.clearRect(0, 0, poseCanvas.width, poseCanvas.height);

			if (result.landmarks && result.landmarks.length > 0) {
				const drawingUtils = new DrawingUtils(canvasCtx);
				const leftColor = '#FF6F61'; // Red for left keypoints
				const rightColor = '#1E90FF'; // Blue for right keypoints
				const lineColor = '#FFFFFF'; // White for connecting lines

				for (const landmark of result.landmarks) {
					// Draw each keypoint with a color depending on the side
					landmark.forEach((point: any, i: number) => {
						const isLeftSide = i % 2 === 0; // Assuming alternate points for left and right
						drawingUtils.drawLandmarks([point], {
							radius: 5,
							color: isLeftSide ? leftColor : rightColor
						});
					});

					// Draw connectors in white color
					drawingUtils.drawConnectors(landmark, PoseLandmarkerClass.POSE_CONNECTIONS, {
						color: lineColor,
						lineWidth: 4
					});
				}

				console.log('Pose landmarks drawn.');
			} else {
				console.log('No pose landmarks detected.');
			}
		} catch (error) {
			console.error('Error during pose detection:', error);
		}

		poseVisible = true;
	}

	// Face Landmark Detection Function with Extended Grid Lines
	// Face Landmark Detection Function with Grid Lines within Bounding Box
	async function toggleFaceLandmark() {
		console.log('Face landmark detection toggled');
		if (faceVisible) {
			// Remove the face overlay if it's currently visible
			if (faceCanvas) {
				faceCanvas.remove();
				faceCanvas = null;
			}
			faceVisible = false;
			return;
		}

		if (!landmarkersInitialized) {
			console.error('Landmarkers are not initialized yet.');
			return;
		}

		if (!faceLandmarker) {
			console.error('FaceLandmarker is not initialized.');
			return;
		}

		// Create a new canvas for drawing face landmarks
		createCanvasOverlay('face');
		if (!faceCanvas) {
			console.error('Failed to create face canvas overlay.');
			return;
		}

		const canvasCtx = faceCanvas.getContext('2d');
		if (!canvasCtx) {
			console.error('Failed to get face canvas context.');
			return;
		}

		resizeCanvas();
		// Ensure only one resize listener is added
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

		faceVisible = true;
	}

	// Cleanup on component destroy
	onDestroy(() => {
		window.removeEventListener('resize', handleResize);
		if (poseCanvas) {
			poseCanvas.remove();
			poseCanvas = null;
		}
		if (faceCanvas) {
			faceCanvas.remove();
			faceCanvas = null;
		}
		if (poseLandmarker) {
			poseLandmarker.close();
			poseLandmarker = null;
		}
		if (faceLandmarker) {
			faceLandmarker.close();
			faceLandmarker = null;
		}
	});

	// Initialize landmarkers on component mount
	onMount(() => {
		initializeLandmarkers();
	});
</script>

<div class="grid grid-cols-3 gap-4">
	<div class="left-0 gap-2">
		<button
			class="rounded-full bg-transparent p-1 text-gray-800"
			on:click={removeImage}
			title="Remove Image"
		>
			<FontAwesomeIcon icon={faTimes} />
		</button>
	</div>
	<div></div>
	<div class="gap-2 text-right">
		<button
			class="rounded-full bg-transparent p-1 text-gray-800"
			on:click={detectPose}
			disabled={!landmarkersInitialized}
			title={landmarkersInitialized
				? poseVisible
					? 'Hide Pose'
					: 'Detect Pose'
				: 'Initializing...'}
		>
			<FontAwesomeIcon icon={faMagicWandSparkles} />
		</button>
		<button
			class="rounded-full bg-transparent p-1 text-gray-800"
			on:click={toggleFaceLandmark}
			disabled={!landmarkersInitialized}
			title={landmarkersInitialized
				? faceVisible
					? 'Hide Face Landmarks'
					: 'Detect Face Landmarks'
				: 'Initializing...'}
		>
			<FontAwesomeIcon icon={faBorderAll} />
		</button>
	</div>
	<div class="image-container relative col-span-3">
		{#if !landmarkersInitialized && !initializationError}
			<div class="loading-overlay">Initializing landmarkers...</div>
		{/if}
		{#if initializationError}
			<div class="error-message">
				{initializationError}
			</div>
		{/if}
		<img
			bind:this={imageElement}
			src={url}
			alt="Uploaded image"
			class="w-full rounded-lg object-cover shadow-md"
			on:load={() => {
				// Resize canvases when image loads
				resizeCanvas();
			}}
		/>
	</div>
</div>

<style>
	.image-container {
		position: relative;
	}
	canvas {
		position: absolute;
		top: 0;
		left: 0;
		pointer-events: none;
	}
	/* Optional: Styles for loading and error messages */
	.loading-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(255, 255, 255, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 30;
		font-size: 1.2rem;
		color: #333;
	}
	.error-message {
		color: red;
		margin-top: 8px;
	}
	/* Additional Styles */
	.grid-container {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
	}
	.button-group {
		display: flex;
		gap: 0.5rem;
	}
	button {
		cursor: pointer;
	}
	button:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}
</style>
