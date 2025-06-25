// core/store.js

import { initialState } from './initial-state.js';

const listeners = new Set();
let state = structuredClone(initialState);

// Build allowed key map
const allowedStructure = Object.fromEntries(
  Object.entries(initialState).map(([key, value]) => {
    if (typeof value === 'object' && value !== null) {
      return [key, new Set(Object.keys(value))];
    } else {
      return [key, null]; // flat value
    }
  })
);

export const store = {
  getState() {
    return structuredClone(state);
  },

  setState(patch) {
    for (const key of Object.keys(patch)) {
      const patchValue = patch[key];
      const allowedSubkeys = allowedStructure[key];

      if (!(key in allowedStructure)) {
        throw new Error(`store.setState: unknown key or namespace "${key}"`);
      }

      // Flat key
      if (allowedSubkeys === null) {
        state[key] = patchValue;

      // Namespaced object
      } else {
        if (typeof patchValue !== 'object' || patchValue === null) {
          throw new Error(`store.setState: value for "${key}" must be an object`);
        }

        for (const subkey of Object.keys(patchValue)) {
          if (!allowedSubkeys.has(subkey)) {
            throw new Error(`store.setState: unknown key "${subkey}" in namespace "${key}"`);
          }
        }

        state[key] = { ...state[key], ...patchValue };
      }
    }

    for (const fn of listeners) fn(store.getState());
  },

  subscribe(fn) {
    listeners.add(fn);
    fn(store.getState());
    return () => listeners.delete(fn);
  },

  reset() {
    state = structuredClone(initialState);
    for (const fn of listeners) fn(store.getState());
  }
};
