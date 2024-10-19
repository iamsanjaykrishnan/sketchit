<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import Controls from './controls/Controls.svelte';
    import PoseDetection from './overlay/PoseDetection.svelte';
    import FaceGridDetection from './overlay/FaceGridDetection.svelte';
    import { openDB, getModelFromDB, saveModelToDB } from '../../utils/indexedDbHelper';
  
    export let url: string;
    export let removeImage: () => void;
  
    let poseLandmarker: any;
    let faceLandmarker: any;
    let imageElement: HTMLImageElement;
    let DrawingUtils: any;
    let PoseLandmarkerClass: any;
    let FaceLandmarkerClass: any;
    let poseVisible = false;
    let faceVisible = false;
    let landmarkersInitialized = false;
    let initializationError = '';
  
    // Helper to fetch binary data of model
    async function fetchModelBinary(url: string): Promise<Blob> {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch model file');
      }
      return await response.blob();
    }
  
    async function initializeLandmarkers() {
  try {
    const vision = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3');
    PoseLandmarkerClass = vision.PoseLandmarker;
    FaceLandmarkerClass = vision.FaceLandmarker;
    DrawingUtils = vision.DrawingUtils;
    const FilesetResolver = vision.FilesetResolver;

    const db = await openDB('landmarkerDB', 1);

    let poseModelBinary = await getModelFromDB(db, 'poseLandmarker');
    let faceModelBinary = await getModelFromDB(db, 'faceLandmarker');

    if (!poseModelBinary) {
      // Fetch and store the pose model file in IndexedDB
      poseModelBinary = await fetchModelBinary(
        'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/latest/pose_landmarker_heavy.task'
      );
      await saveModelToDB(db, 'poseLandmarker', poseModelBinary);
    }

    if (!faceModelBinary) {
      // Fetch and store the face model file in IndexedDB
      faceModelBinary = await fetchModelBinary(
        'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'
      );
      await saveModelToDB(db, 'faceLandmarker', faceModelBinary);
    }

    const filesetResolver = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
    );

    // Convert ArrayBuffer to Uint8Array
    const poseModelUint8Array = new Uint8Array(await poseModelBinary.arrayBuffer());
    const faceModelUint8Array = new Uint8Array(await faceModelBinary.arrayBuffer());

    // Initialize the pose landmarker using the correct Uint8Array format
    poseLandmarker = await PoseLandmarkerClass.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetBuffer: poseModelUint8Array, // Use Uint8Array for binary data
        delegate: 'GPU'
      },
      runningMode: 'IMAGE',
      numPoses: 1
    });

    // Initialize the face landmarker using the correct Uint8Array format
    faceLandmarker = await FaceLandmarkerClass.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetBuffer: faceModelUint8Array, // Use Uint8Array for binary data
        delegate: 'GPU'
      },
      outputFaceBlendshapes: false,
      runningMode: 'IMAGE',
      numFaces: 1
    });

    landmarkersInitialized = true;
  } catch (error) {
    console.error('Error initializing landmarkers:', error);
    initializationError = 'Failed to initialize landmarkers. Please try again later.';
  }
}



  
    function handleRemoveImage() {
      removeImage();
    }
  
    function handleDetectPose() {
      poseVisible = !poseVisible;
    }
  
    function handleToggleFaceLandmark() {
      faceVisible = !faceVisible;
    }
  
    onMount(() => {
      initializeLandmarkers();
    });
  
    onDestroy(() => {
      if (poseLandmarker) {
        poseLandmarker.close();
        poseLandmarker = null;
      }
      if (faceLandmarker) {
        faceLandmarker.close();
        faceLandmarker = null;
      }
    });
  </script>
  
  <Controls
    {landmarkersInitialized}
    {poseVisible}
    {faceVisible}
    on:removeImage={handleRemoveImage}
    on:detectPose={handleDetectPose}
    on:toggleFaceLandmark={handleToggleFaceLandmark}
  />
  
  <div class="image-container relative">
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
      class="image rounded-lg object-cover shadow-md"
    />
    {#if poseVisible}
      <PoseDetection
        {imageElement}
        {poseLandmarker}
        {DrawingUtils}
        {PoseLandmarkerClass}
      />
    {/if}
    {#if faceVisible}
      <FaceGridDetection
        {imageElement}
        {faceLandmarker}
        {DrawingUtils}
        {FaceLandmarkerClass}
      />
    {/if}
  </div>
  
  <style>
    .image-container {
      position: relative;
    }
  
    .image {
      max-height: 80vh; /* Set maximum height to 80% of viewport height */
      max-width: 90vw;  /* Set maximum width to 90% of viewport width */
      width: auto;      /* Maintain aspect ratio and allow image to resize */
      height: auto;     /* Maintain aspect ratio */
      display: block;
      margin: auto;     /* Optional: Center the image within the container */
    }
  
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
  </style>
  