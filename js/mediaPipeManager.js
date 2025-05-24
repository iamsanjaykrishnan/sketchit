// js/mediaPipeManager.js
import { FaceLandmarker, PoseLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";
import * as config from './config.js';
import * as state from './state.js';
import * as utils from './utils.js';
import { updateIconStates, showFaceSelectionModal } from './uiManager.js';
import { redrawCanvas } from "./canvasManager.js";
import * as dom from './domElements.js'; // Added this import

export async function initializeVisionResolver() {
    if (!state.visionResolver) {
        utils.addComment('Loading MediaPipe Vision Tasks...', 'info');
        try {
            const resolver = await FilesetResolver.forVisionTasks(config.MEDIAPIPE_VISION_TASKS_URL);
            state.setVisionResolver(resolver);
            utils.addComment('Vision Tasks ready.', 'success');
        } catch (error) {
            console.error("Vision Tasks Init Error:", error);
            utils.addComment(`Error initializing Vision Tasks: ${error.message || 'Unknown error'}`, 'error');
            state.setVisionResolver(null);
            throw error;
        }
    }
    return state.visionResolver;
}

export async function initializeFaceLandmarker() {
    try {
        const resolver = await initializeVisionResolver();
        if (!resolver) return;
        utils.addComment('Loading Face Landmarker model...', 'info');
        const faceModelBuffer = await utils.getModelAssetBuffer(state.landmarkDB, config.FACE_MODEL_KEY, config.FACE_MODEL_URL);

        if (!faceModelBuffer) {
            utils.addComment(`Failed to load Face Landmarker model asset.`, 'error');
            state.setFaceLandmarkerInitialized(false);
            updateIconStates();
            return;
        }

        const landmarker = await FaceLandmarker.createFromOptions(resolver, {
            baseOptions: { modelAssetBuffer: faceModelBuffer, delegate: "GPU" },
            outputFaceBlendshapes: true,
            runningMode: "IMAGE",
            numFaces: 3
        });
        state.setFaceLandmarker(landmarker);
        utils.addComment('Face Landmarker loaded.', 'success');
        state.setFaceLandmarkerInitialized(true);
    } catch (e) {
        console.error("Face Landmarker Init Error:", e);
        utils.addComment(`Error initializing Face Landmarker: ${e.message || e}`, 'error');
        state.setFaceLandmarkerInitialized(false);
    } finally {
        updateIconStates();
    }
}

export async function initializePoseLandmarker() {
    try {
        const resolver = await initializeVisionResolver();
        if (!resolver) return;
        utils.addComment('Loading Pose Landmarker model...', 'info');
        const poseModelBuffer = await utils.getModelAssetBuffer(state.landmarkDB, config.POSE_MODEL_KEY, config.POSE_MODEL_URL);

        if (!poseModelBuffer) {
            utils.addComment(`Failed to load Pose Landmarker model asset.`, 'error');
            state.setPoseLandmarkerInitialized(false);
            updateIconStates();
            return;
        }
        const landmarker = await PoseLandmarker.createFromOptions(resolver, {
            baseOptions: { modelAssetBuffer: poseModelBuffer, delegate: "GPU" },
            runningMode: "IMAGE",
            numPoses: 3
        });
        state.setPoseLandmarker(landmarker);
        utils.addComment('Pose Landmarker loaded.', 'success');
        state.setPoseLandmarkerInitialized(true);
    } catch (e) {
        console.error("Pose Landmarker Init Error:", e);
        utils.addComment(`Error initializing Pose Landmarker: ${e.message || e}`, 'error');
        state.setPoseLandmarkerInitialized(false);
    } finally {
        updateIconStates();
    }
}

export function detectFaces() {
    if (!state.faceLandmarker || !state.currentImageElement) {
        utils.addComment('Face landmarker not ready or no image.', 'warning');
        return;
    }
    utils.addComment('Running face detection...', 'info');
    try {
        const results = state.faceLandmarker.detect(state.currentImageElement);
        state.setLastFaceDetections(results);
        const numFaces = results.faceLandmarks.length;
        if (numFaces > 0) {
            utils.addComment(`Found ${numFaces} face(s).`, 'success');
            if (numFaces > 1) {
                state.setSelectedReferenceFaceIndex(null);
                utils.addComment(`Select face for grid.`, 'info');
                showFaceSelectionModal(numFaces);
                return true; // Indicates modal is shown
            } else {
                state.setSelectedReferenceFaceIndex(0);
            }
        } else {
            utils.addComment('No faces detected.', 'info');
            state.setLastFaceDetections(null);
            state.setShowFaceLandmarks(false); // Turn off if no faces found
        }
    } catch (error) {
        utils.addComment(`Face detection failed: ${error.message || error}`, 'error');
        console.error("Face detection error:", error);
        state.setLastFaceDetections(null);
        state.setShowFaceLandmarks(false); // Turn off on error
    }
    return false; // Indicates modal not shown or detection proceeded
}

export function detectPoses() {
    if (!state.poseLandmarker || !state.currentImageElement) {
        utils.addComment('Pose landmarker not ready or no image.', 'warning');
        return;
    }
    utils.addComment('Running pose detection...', 'info');
    try {
        const results = state.poseLandmarker.detect(state.currentImageElement);
        state.setLastPoseDetections(results);
        if (results.landmarks.length > 0) {
            utils.addComment(`Found ${results.landmarks.length} pose(s).`, 'success');
            const newDraggableLandmarks = results.landmarks.map(singlePoseLms =>
                singlePoseLms.map(lm => ({
                    x: lm.x * dom.overlayCanvas.width, // Corrected: dom is now defined
                    y: lm.y * dom.overlayCanvas.height, // Corrected: dom is now defined
                    visibility: lm.visibility
                }))
            );
            state.setDraggablePoseLandmarks(newDraggableLandmarks);
        } else {
            utils.addComment('No poses detected.', 'info');
            state.setDraggablePoseLandmarks([]);
            state.setShowPoseLandmarks(false);
        }
    } catch (error) {
        utils.addComment(`Pose detection failed: ${error.message || error}`, 'error');
        console.error("Pose detection error:", error); // Log the error
        state.setDraggablePoseLandmarks([]);
        state.setShowPoseLandmarks(false);
    }
}