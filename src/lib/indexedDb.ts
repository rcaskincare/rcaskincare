const DB_NAME = 'rca_skincare_offline_db';
const DB_VERSION = 1;

export interface QueuedOfflineTransaction {
  id: string; // queue item id
  idempotencyKey: string;
  payload: any;
  queuedAt: string;
  status: 'PENDING' | 'SYNCING' | 'FAILED';
  retryCount: number;
  lastError?: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB tidak didukung pada browser ini'));
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains('offlineQueue')) {
        db.createObjectStore('offlineQueue', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('cachedCatalog')) {
        db.createObjectStore('cachedCatalog', { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function queueOfflineTransaction(payload: any): Promise<QueuedOfflineTransaction> {
  const db = await openDB();
  const queueItem: QueuedOfflineTransaction = {
    id: 'offline-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    idempotencyKey: payload.idempotencyKey || ('idemp-' + Date.now()),
    payload,
    queuedAt: new Date().toISOString(),
    status: 'PENDING',
    retryCount: 0
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction('offlineQueue', 'readwrite');
    const store = tx.objectStore('offlineQueue');
    const request = store.put(queueItem);
    request.onsuccess = () => resolve(queueItem);
    request.onerror = () => reject(request.error);
  });
}

export async function getOfflineQueue(): Promise<QueuedOfflineTransaction[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('offlineQueue', 'readonly');
      const store = tx.objectStore('offlineQueue');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

export async function removeQueuedTransaction(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offlineQueue', 'readwrite');
    const store = tx.objectStore('offlineQueue');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function saveCatalogCache(key: string, data: any): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('cachedCatalog', 'readwrite');
    const store = tx.objectStore('cachedCatalog');
    store.put({ key, data, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Failed to save catalog cache:', err);
  }
}

export async function getCatalogCache<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('cachedCatalog', 'readonly');
      const store = tx.objectStore('cachedCatalog');
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ? req.result.data : null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}
