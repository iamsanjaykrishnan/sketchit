// js/state.js
export let faceLandmarker = null;
export let poseLandmarker = null;
export let drawingUtils = null;
export let visionResolver = null;

export let isFaceLandmarkerInitialized = false;
export let isPoseLandmarkerInitialized = false;

export let currentImageElement = null;
export let lastFaceDetections = null;
export let lastPoseDetections = null;

// Draggable Pose State
export let draggablePoseLandmarks = []; // Array of arrays (for multiple poses)
export let draggedPointInfo = null; // { poseIndex: number, pointIndex: number }
export let isDraggingPosePoint = false;
export let dragOffsetX = 0;
export let dragOffsetY = 0;

// Manual Grid State
export let isManualGridModeActive = false;
export let isDrawingManualGrid = false;
export let isAdjustingManualGrid = false;
export let manualGridStartX = 0;
export let manualGridStartY = 0;
export let manualGridCurrentX = 0;
export let manualGridCurrentY = 0;
export let manualGridRect = null; // { x, y, size }
export let finalManualGridRect = null; // { x, y, size }
export let showFinalManualGrid = false;
export let adjustmentHandles = []; // For manual grid adjustment
export let draggedHandleType = null; // For manual grid adjustment
export let isDraggingGridSquare = false; // For dragging the entire manual grid square
export let gridDragStartX = 0; // Initial X of grid when square drag starts
export let gridDragStartY = 0; // Initial Y of grid when square drag starts


// Hover State
export let isHoveringPosePoint = false;
export let isHoveringGridHandle = false;
export let isHoveringGridSquare = false;

// Visibility State
export let showFaceLandmarks = false;
export let showPoseLandmarks = false;

// Other UI/App State
export let isCommentAreaInitialized = false;
export let selectedReferenceFaceIndex = null; // For multi-face selection
export let landmarkDB = null; // For IndexedDB

// Functions to update state (optional, can also be updated directly if careful)
export function setFaceLandmarker(instance) { faceLandmarker = instance; }
export function setPoseLandmarker(instance) { poseLandmarker = instance; }
export function setDrawingUtils(instance) { drawingUtils = instance; }
export function setVisionResolver(instance) { visionResolver = instance; }
export function setFaceLandmarkerInitialized(value) { isFaceLandmarkerInitialized = value; }
export function setPoseLandmarkerInitialized(value) { isPoseLandmarkerInitialized = value; }
export function setCurrentImageElement(element) { currentImageElement = element; }
export function setLastFaceDetections(detections) { lastFaceDetections = detections; }
export function setLastPoseDetections(detections) { lastPoseDetections = detections; }
export function setDraggablePoseLandmarks(landmarks) { draggablePoseLandmarks = landmarks; }
export function setDraggedPointInfo(info) { draggedPointInfo = info; }
export function setIsDraggingPosePoint(value) { isDraggingPosePoint = value; }
export function setDragOffsetX(value) { dragOffsetX = value; }
export function setDragOffsetY(value) { dragOffsetY = value; }
export function setIsManualGridModeActive(value) { isManualGridModeActive = value; }
export function setIsDrawingManualGrid(value) { isDrawingManualGrid = value; }
export function setIsAdjustingManualGrid(value) { isAdjustingManualGrid = value; }
export function setManualGridStartX(value) { manualGridStartX = value; }
export function setManualGridStartY(value) { manualGridStartY = value; }
export function setManualGridCurrentX(value) { manualGridCurrentX = value; }
export function setManualGridCurrentY(value) { manualGridCurrentY = value; }
export function setManualGridRect(rect) { manualGridRect = rect; }
export function setFinalManualGridRect(rect) { finalManualGridRect = rect; }
export function setShowFinalManualGrid(value) { showFinalManualGrid = value; }
export function setAdjustmentHandles(handles) { adjustmentHandles = handles; }
export function setDraggedHandleType(type) { draggedHandleType = type; }
export function setIsDraggingGridSquare(value) { isDraggingGridSquare = value; }
export function setGridDragStartX(value) { gridDragStartX = value; }
export function setGridDragStartY(value) { gridDragStartY = value; }
export function setIsHoveringPosePoint(value) { isHoveringPosePoint = value; }
export function setIsHoveringGridHandle(value) { isHoveringGridHandle = value; }
export function setIsHoveringGridSquare(value) { isHoveringGridSquare = value; }
export function setShowFaceLandmarks(value) { showFaceLandmarks = value; }
export function setShowPoseLandmarks(value) { showPoseLandmarks = value; }
export function setIsCommentAreaInitialized(value) { isCommentAreaInitialized = value; }
export function setSelectedReferenceFaceIndex(index) { selectedReferenceFaceIndex = index; }
export function setLandmarkDB(db) { landmarkDB = db; }