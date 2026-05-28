// Tiny global store using a singleton + listeners. No extra deps.
import { useEffect, useState } from "react";

const state = {
  job: null, // full job payload from /api/upload
  isLoading: false,
  error: null,
};
const listeners = new Set();

function notify() {
  listeners.forEach((cb) => cb({ ...state }));
}

export const inventoryStore = {
  get() {
    return { ...state };
  },
  setJob(job) {
    state.job = job;
    state.isLoading = false;
    state.error = null;
    notify();
  },
  setLoading(v) {
    state.isLoading = v;
    notify();
  },
  setError(err) {
    state.error = err;
    state.isLoading = false;
    notify();
  },
  reset() {
    state.job = null;
    state.isLoading = false;
    state.error = null;
    notify();
  },
};

export function useInventory() {
  const [snap, setSnap] = useState(() => inventoryStore.get());
  useEffect(() => {
    const cb = (s) => setSnap(s);
    listeners.add(cb);
    return () => listeners.delete(cb);
  }, []);
  return snap;
}
