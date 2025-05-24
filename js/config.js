// js/config.js
export const DB_NAME = 'mediaPipeModelDB';
export const DB_VERSION = 1;
export const MODEL_STORE_NAME = 'models';

export const FACE_MODEL_KEY = 'faceLandmarker_v1';
export const POSE_MODEL_KEY = 'poseLandmarkerHeavy_v1';

export const FACE_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
export const POSE_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task';

export const MIN_GRID_SIZE = 10; // Minimum size for manually drawn grid
export const POINT_RADIUS = 5; // Radius for draggable pose points
export const HIT_RADIUS = POINT_RADIUS * 1.5; // Hit radius for selecting pose points
export const HANDLE_SIZE = 10; // Visual size of grid adjustment handles
export const HANDLE_HIT_RADIUS = HANDLE_SIZE * 1.5; // Hit radius for grid adjustment handles

export const MEDIAPIPE_VISION_TASKS_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm";