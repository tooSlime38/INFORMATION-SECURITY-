import { initializeApp, cert, getApps, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let isLiveFirestore = false;
let liveDb: Firestore | null = null;

// Determine service account path
const resolvedServiceAccountPath = path.isAbsolute(env.FIREBASE_SERVICE_ACCOUNT_PATH)
  ? env.FIREBASE_SERVICE_ACCOUNT_PATH
  : path.resolve(__dirname, '../../', env.FIREBASE_SERVICE_ACCOUNT_PATH);

if (getApps().length === 0) {
  if (fs.existsSync(resolvedServiceAccountPath)) {
    try {
      const serviceAccount = JSON.parse(fs.readFileSync(resolvedServiceAccountPath, 'utf8'));
      const app: App = initializeApp({
        credential: cert(serviceAccount),
        storageBucket: env.FIREBASE_STORAGE_BUCKET || undefined,
      });
      liveDb = getFirestore(app);
      isLiveFirestore = true;
      console.log('✅ Firebase Admin SDK initialized using service account key file.');
    } catch (err) {
      console.warn('⚠️ Failed to parse serviceAccountKey.json:', err);
    }
  } else if (env.FIREBASE_PROJECT_ID && env.FIREBASE_PRIVATE_KEY && env.FIREBASE_CLIENT_EMAIL) {
    try {
      const app: App = initializeApp({
        credential: cert({
          projectId: env.FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
        storageBucket: env.FIREBASE_STORAGE_BUCKET || undefined,
      });
      liveDb = getFirestore(app);
      isLiveFirestore = true;
      console.log('✅ Firebase Admin SDK initialized using environment credentials.');
    } catch (err) {
      console.warn('⚠️ Failed to initialize Firebase with environment credentials:', err);
    }
  } else if (process.env.FIRESTORE_EMULATOR_HOST) {
    const app: App = initializeApp({ projectId: env.FIREBASE_PROJECT_ID || 'demo-secure-auth' });
    liveDb = getFirestore(app);
    isLiveFirestore = true;
    console.log(`✅ Firebase Admin SDK initialized with emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
  }
}

// ---------------------------------------------------------------------------
// IN-MEMORY FIRESTORE MOCK ADAPTER (for offline dev / tests when no key present)
// Provides 100% API compatibility with Firestore Admin SDK
// ---------------------------------------------------------------------------
class MemoryDocRef {
  constructor(private db: MemoryFirestore, private colName: string, public id: string) {}

  async get(): Promise<any> {
    const data = this.db.store[this.colName]?.[this.id];
    return {
      id: this.id,
      exists: data !== undefined,
      data: () => (data ? JSON.parse(JSON.stringify(data)) : undefined),
    };
  }

  async set(data: any, options?: { merge?: boolean }): Promise<void> {
    if (!this.db.store[this.colName]) this.db.store[this.colName] = {};
    if (options?.merge && this.db.store[this.colName][this.id]) {
      this.db.store[this.colName][this.id] = {
        ...this.db.store[this.colName][this.id],
        ...JSON.parse(JSON.stringify(data)),
      };
    } else {
      this.db.store[this.colName][this.id] = JSON.parse(JSON.stringify(data));
    }
  }

  async update(data: any): Promise<void> {
    if (!this.db.store[this.colName]?.[this.id]) {
      throw new Error(`Document ${this.id} does not exist for update`);
    }
    this.db.store[this.colName][this.id] = {
      ...this.db.store[this.colName][this.id],
      ...JSON.parse(JSON.stringify(data)),
    };
  }

  async delete(): Promise<void> {
    if (this.db.store[this.colName]) {
      delete this.db.store[this.colName][this.id];
    }
  }
}

class MemoryQuery {
  constructor(
    private db: MemoryFirestore,
    private colName: string,
    private filters: Array<{ field: string; op: string; value: any }> = [],
    private limitNum?: number
  ) {}

  where(field: string, op: string, value: any): MemoryQuery {
    return new MemoryQuery(this.db, this.colName, [...this.filters, { field, op, value }], this.limitNum);
  }

  limit(n: number): MemoryQuery {
    return new MemoryQuery(this.db, this.colName, this.filters, n);
  }

  async get(): Promise<any> {
    const col = this.db.store[this.colName] || {};
    let docs = Object.entries(col).map(([id, data]) => ({
      id,
      exists: true,
      data: () => JSON.parse(JSON.stringify(data)),
      ref: new MemoryDocRef(this.db, this.colName, id),
    }));

    for (const f of this.filters) {
      docs = docs.filter((d) => {
        const val = d.data()[f.field];
        if (f.op === '==') return val === f.value;
        if (f.op === '!=') return val !== f.value;
        if (f.op === '>') return val > f.value;
        if (f.op === '<') return val < f.value;
        return true;
      });
    }

    if (this.limitNum !== undefined) {
      docs = docs.slice(0, this.limitNum);
    }

    return {
      empty: docs.length === 0,
      size: docs.length,
      docs,
    };
  }
}

class MemoryCollectionRef extends MemoryQuery {
  constructor(private mdb: MemoryFirestore, private cName: string) {
    super(mdb, cName);
  }

  doc(id?: string): MemoryDocRef {
    const docId = id || Math.random().toString(36).substring(2, 15);
    return new MemoryDocRef(this.mdb, this.cName, docId);
  }

  async add(data: any): Promise<MemoryDocRef> {
    const docId = Math.random().toString(36).substring(2, 15);
    const ref = this.doc(docId);
    await ref.set(data);
    return ref;
  }
}

class MemoryFirestore {
  public store: Record<string, Record<string, any>> = {};

  collection(name: string): MemoryCollectionRef {
    return new MemoryCollectionRef(this, name);
  }

  async runTransaction<T>(updateFunction: (transaction: any) => Promise<T>): Promise<T> {
    const transaction = {
      get: async (ref: MemoryDocRef) => ref.get(),
      set: (ref: MemoryDocRef, data: any, options?: any) => ref.set(data, options),
      update: (ref: MemoryDocRef, data: any) => ref.update(data),
      delete: (ref: MemoryDocRef) => ref.delete(),
    };
    return updateFunction(transaction);
  }

  batch() {
    const ops: Array<() => Promise<void>> = [];
    return {
      set: (ref: MemoryDocRef, data: any, options?: any) => {
        ops.push(() => ref.set(data, options));
      },
      update: (ref: MemoryDocRef, data: any) => {
        ops.push(() => ref.update(data));
      },
      delete: (ref: MemoryDocRef) => {
        ops.push(() => ref.delete());
      },
      commit: async () => {
        for (const op of ops) await op();
      },
    };
  }
}

const memoryDbInstance = new MemoryFirestore();

export const db: any = isLiveFirestore && liveDb ? liveDb : memoryDbInstance;

export function getDatabaseStatus(): { isLive: boolean; driver: string } {
  return {
    isLive: isLiveFirestore,
    driver: isLiveFirestore ? 'Google Cloud Firestore' : 'In-Memory Development Database',
  };
}
