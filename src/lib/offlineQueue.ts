'use client';

import { GetVisualMedia } from '@/types/definitions';

export interface OfflinePost {
  id: string; // client-generated UUID
  content: string;
  visualMedia: GetVisualMedia[];
  timestamp: number; // client timestamp
  clientId: string; // client identifier for ordering
  retryCount: number;
  lastAttempt?: number;
}

export interface OfflineQueueManager {
  addPost: (post: Omit<OfflinePost, 'id' | 'retryCount'>) => Promise<string>;
  getPosts: () => Promise<OfflinePost[]>;
  removePost: (id: string) => Promise<void>;
  updateRetryCount: (id: string, retryCount: number) => Promise<void>;
  clear: () => Promise<void>;
}

class IndexedDBOfflineQueue implements OfflineQueueManager {
  private dbName = 'munia-offline-queue';
  private storeName = 'posts';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB is not supported'));
        return;
      }

      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('clientId', 'clientId', { unique: false });
        }
      };
    });
  }

  private ensureDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve(this.db);
      } else {
        this.init()
          .then(() => {
            if (this.db) {
              resolve(this.db);
            } else {
              reject(new Error('Failed to initialize database'));
            }
          })
          .catch(reject);
      }
    });
  }

  async addPost(postData: Omit<OfflinePost, 'id' | 'retryCount'>): Promise<string> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const post: OfflinePost = {
        ...postData,
        id: crypto.randomUUID(),
        retryCount: 0,
      };

      const request = store.add(post);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(post.id);
    });
  }

  async getPosts(): Promise<OfflinePost[]> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const posts = request.result as OfflinePost[];
        // Sort by timestamp, then by clientId for stable ordering
        posts.sort((a, b) => {
          if (a.timestamp !== b.timestamp) {
            return a.timestamp - b.timestamp;
          }
          return a.clientId.localeCompare(b.clientId);
        });
        resolve(posts);
      };
    });
  }

  async removePost(id: string): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async updateRetryCount(id: string, retryCount: number): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const getRequest = store.get(id);

      getRequest.onerror = () => reject(getRequest.error);
      getRequest.onsuccess = () => {
        const post = getRequest.result as OfflinePost;
        if (post) {
          post.retryCount = retryCount;
          post.lastAttempt = Date.now();
          
          const putRequest = store.put(post);
          putRequest.onerror = () => reject(putRequest.error);
          putRequest.onsuccess = () => resolve();
        } else {
          resolve();
        }
      };
    });
  }

  async clear(): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

// Singleton instance
export const offlineQueue = new IndexedDBOfflineQueue();

// Initialize on module load
if (typeof window !== 'undefined') {
  offlineQueue.init().catch(console.error);
}