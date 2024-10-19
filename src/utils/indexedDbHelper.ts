// src/utils/indexedDbHelper.ts
export async function openDB(name: string, version: number) {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(name, version);

    request.onupgradeneeded = function () {
      const db = request.result;
      if (!db.objectStoreNames.contains('models')) {
        db.createObjectStore('models', { keyPath: 'name' });
      }
    };

    request.onsuccess = function () {
      resolve(request.result);
    };

    request.onerror = function () {
      reject('Error opening IndexedDB');
    };
  });
}


export async function saveModelToDB(db: IDBDatabase, modelName: string, modelData: Blob) {
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction('models', 'readwrite');
    const store = transaction.objectStore('models');

    const request = store.put({ name: modelName, data: modelData });

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject('Error saving model to IndexedDB');
    };
  });
}

export async function getModelFromDB(db: IDBDatabase, modelName: string) {
  return new Promise<Blob | null>((resolve, reject) => {
    const transaction = db.transaction('models', 'readonly');
    const store = transaction.objectStore('models');

    const request = store.get(modelName);

    request.onsuccess = () => {
      resolve(request.result?.data || null);
    };

    request.onerror = () => {
      reject('Error retrieving model from IndexedDB');
    };
  });
}
