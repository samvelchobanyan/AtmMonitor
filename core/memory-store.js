const memory = {};

export const memoryStore = {
  set(key, value) {
    memory[key] = value;
  },
  get(key, defaultValue = undefined) {
    return Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : defaultValue;
  },
  remove(key) {
    delete memory[key];
  },
  clear() {
    Object.keys(memory).forEach(k => delete memory[k]);
  }
};

export default memoryStore;
