// js/utils.js
import * as dom from './domElements.js';
import * as state from './state.js';
import * as config from './config.js';

export function addComment(message, type = 'info', username = 'System') {
    if (!dom.commentArea) return;
    if (!state.isCommentAreaInitialized && (dom.commentArea.innerHTML.includes('Initializing MediaPipe...') || dom.commentArea.innerHTML.includes('Comments will appear here...'))) {
        dom.commentArea.innerHTML = '';
        state.setIsCommentAreaInitialized(true);
    } else if (dom.commentArea.innerHTML === '') {
        state.setIsCommentAreaInitialized(true);
    }

    const commentElement = document.createElement('p');
    const userSpan = document.createElement('span');
    const messageSpan = document.createElement('span');

    userSpan.className = 'comment-username';
    userSpan.textContent = username;
    messageSpan.className = `comment-${type}`;
    messageSpan.textContent = ` ${message}`;

    commentElement.appendChild(userSpan);
    commentElement.appendChild(messageSpan);
    dom.commentArea.appendChild(commentElement);
    dom.commentArea.scrollTop = dom.commentArea.scrollHeight;
}

export function clearCanvas() {
    if (dom.canvasCtx && dom.overlayCanvas) {
        dom.canvasCtx.clearRect(0, 0, dom.overlayCanvas.width, dom.overlayCanvas.height);
    }
}

export function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
    const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
}

// --- IndexedDB Helper Functions ---
export async function openDB(name, version) {
    return new Promise((resolve, reject) => {
        addComment(`Opening model cache DB (${name} v${version})...`, 'info');
        const request = indexedDB.open(name, version);
        request.onupgradeneeded = function () {
            try {
                const db = request.result;
                if (!db.objectStoreNames.contains(config.MODEL_STORE_NAME)) {
                    db.createObjectStore(config.MODEL_STORE_NAME, { keyPath: 'name' });
                }
            } catch (err) {
                console.error('Error during DB upgrade:', err);
                reject('Error during DB upgrade');
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = (e) => {
            console.error('Error opening IndexedDB:', e);
            reject('Error opening IndexedDB');
        };
    });
}

export async function saveModelToDB(db, modelName, modelData) {
    return new Promise((resolve, reject) => {
        if (!db) return reject('DB not available for saving model.');
        try {
            const tx = db.transaction(config.MODEL_STORE_NAME, 'readwrite');
            const store = tx.objectStore(config.MODEL_STORE_NAME);
            const request = store.put({ name: modelName, data: modelData });
            request.onsuccess = () => resolve();
            request.onerror = (e) => {
                console.error(`Error saving ${modelName} to DB:`, e);
                reject(`Error saving ${modelName}`);
            };
        } catch (e) {
            console.error(`Exception during saveModelToDB for ${modelName}:`, e);
            reject(`Error saving ${modelName}`);
        }
    });
}

export async function getModelFromDB(db, modelName) {
    return new Promise((resolve, reject) => {
        if (!db) return reject('DB not available for getting model.');
        try {
            const tx = db.transaction(config.MODEL_STORE_NAME, 'readonly');
            const store = tx.objectStore(config.MODEL_STORE_NAME);
            const request = store.get(modelName);
            request.onsuccess = () => resolve(request.result?.data || null);
            request.onerror = (e) => {
                console.error(`Error getting ${modelName} from DB:`, e);
                reject(`Error getting ${modelName}`);
            };
        } catch (e) {
            console.error(`Exception during getModelFromDB for ${modelName}:`, e);
            reject(`Error getting ${modelName}`);
        }
    });
}

export async function fetchModelBlob(url) {
    addComment(`Downloading model from ${url}...`, 'info');
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Workspace failed for ${url}: ${response.status}`);
    const blob = await response.blob();
    addComment(`Workspaceed model (${(blob.size / 1024 / 1024).toFixed(2)} MB).`, 'success');
    return blob;
}

export async function getModelAssetBuffer(db, modelName, modelUrl) {
    try {
        let modelBlob = await getModelFromDB(db, modelName);
        if (modelBlob) {
            addComment(`Loading ${modelName} from cache...`, 'success');
        } else {
            addComment(`${modelName} not in cache.`, 'info');
            modelBlob = await fetchModelBlob(modelUrl);
            try {
                addComment(`Storing ${modelName} in cache...`, 'info');
                await saveModelToDB(db, modelName, modelBlob);
                addComment(`${modelName} stored.`, 'success');
            } catch (saveError) {
                addComment(`Failed to store ${modelName}: ${saveError}.`, 'warning');
            }
        }
        const arrayBuffer = await modelBlob.arrayBuffer();
        return new Uint8Array(arrayBuffer);
    } catch (error) {
        addComment(`Failed to load/fetch ${modelName}: ${error.message || error}`, 'error');
        console.error(`Error in getModelAssetBuffer for ${modelName}:`, error);
        return null;
    }
}