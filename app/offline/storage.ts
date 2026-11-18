import {
  offlineStateSchema,
  offlineGenerationSchema,
  type OfflineGeneration,
  type OfflineState,
} from "../../shared/utils/offline";

const generations = new Map<string, Promise<OfflineGeneration>>();

async function openDatabase() {
  const database = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("blog-offline", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("state");
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(request.error ?? new Error("Could not open offline storage."));
    };
  });
  return database;
}

export async function changeOfflineState(
  change: (state: OfflineState) => OfflineState,
) {
  const database = await openDatabase();
  try {
    return await new Promise<OfflineState>((resolve, reject) => {
      const transaction = database.transaction("state", "readwrite");
      const store = transaction.objectStore("state");
      const request = store.get("current");
      let state: OfflineState;
      request.onsuccess = () => {
        try {
          const value: unknown = request.result;
          state = change(offlineStateSchema.parse(value ?? {}));
          store.put(state, "current");
        } catch (error) {
          transaction.abort();
          reject(
            error instanceof Error
              ? error
              : new Error("Invalid offline storage."),
          );
        }
      };
      transaction.oncomplete = () => {
        resolve(state);
      };
      transaction.onerror = () => {
        reject(transaction.error ?? new Error("Offline storage failed."));
      };
      transaction.onabort = () => {
        reject(transaction.error ?? new Error("Offline storage was aborted."));
      };
    });
  } finally {
    database.close();
  }
}

async function readRecord(key: string) {
  const database = await openDatabase();
  try {
    return await new Promise<unknown>((resolve, reject) => {
      const transaction = database.transaction("state", "readonly");
      const request = transaction.objectStore("state").get(key);
      let value: unknown;
      request.onsuccess = () => {
        value = request.result;
      };
      transaction.oncomplete = () => {
        resolve(value);
      };
      transaction.onerror = () => {
        reject(
          transaction.error ?? new Error("Could not read offline storage."),
        );
      };
      transaction.onabort = () => {
        reject(transaction.error ?? new Error("Offline storage was aborted."));
      };
    });
  } finally {
    database.close();
  }
}

async function writeRecord(key: string, value: unknown) {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction("state", "readwrite");
      const store = transaction.objectStore("state");
      if (value === undefined) {
        store.delete(key);
      } else {
        store.put(value, key);
      }
      transaction.oncomplete = () => {
        resolve();
      };
      transaction.onerror = () => {
        reject(
          transaction.error ?? new Error("Could not write offline storage."),
        );
      };
      transaction.onabort = () => {
        reject(transaction.error ?? new Error("Offline storage was aborted."));
      };
    });
  } finally {
    database.close();
  }
}

export async function readOfflineState() {
  return offlineStateSchema.parse((await readRecord("current")) ?? {});
}

export function readOfflineGeneration(id: string) {
  let generation = generations.get(id);
  if (!generation) {
    generation = readRecord(`generation:${id}`)
      .then((value) => offlineGenerationSchema.parse(value))
      .catch((error: unknown) => {
        generations.delete(id);
        throw error;
      });
    generations.set(id, generation);
  }
  return generation;
}

export async function saveOfflineGeneration(generation: OfflineGeneration) {
  if (!generations.has(generation.id)) {
    await writeRecord(`generation:${generation.id}`, generation);
    generations.set(generation.id, Promise.resolve(generation));
  }
}

export async function removeOfflineGeneration(id: string) {
  await writeRecord(`generation:${id}`, undefined);
  generations.delete(id);
}
