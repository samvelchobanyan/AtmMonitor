import { api } from './api-client.js';
const logIcons = {
  info: '💡',
  success: '✅',
  warning: '⚠️',
  error: '❌',
  loading: '🔄',
  api: '📡',
  chart: '📊',
  user: '👤',
  data: '💾',
  render: '🎨'
};

export class DynamicElement extends HTMLElement {
  constructor() {
    super();

    // Internal state
    this.state = { isLoading: false, error: false };
    this.storeSubscriptions = new Map();
    this.eventListeners = new Map();
    this.isDestroyed = false;
    this.renderScheduled = false;
  }

  // Define which attributes to observe - override in child classes
  static get observedAttributes() {
    return [];
  }

  connectedCallback() {
    this.onConnected();
    // this.render();
    this.addGlobalEventListeners();
    this.subscribeToStores();
    this.scheduleRender();
  }

  disconnectedCallback() {
    this.onDisconnected();
    this.cleanup();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.onAttributeChange(name, oldValue, newValue);
      this.scheduleRender();
    }
  }

  // Lifecycle hooks - override in child classes
  onConnected() {
    // Called when component is added to DOM
  }

  onDisconnected() {
    // Called when component is removed from DOM
  }

  onAttributeChange(name, oldValue, newValue) {
    // Called when attributes change
  }

  // Override this method in child classes to define the HTML template
  template() {
    return '<div>Override template() method</div>';
  }

  // State management - SIMPLIFIED: always triggers render
  setState(newState) {
    if (this.isDestroyed) return;
    // Simple validation - check if properties exist in current state
     const invalidKeys = Object.keys(newState).filter(key => !(key in this.state));
    if (invalidKeys.length > 0) {
      console.warn(`[${this.constructor.name}] Setting undefined state properties:`, invalidKeys);
      console.warn('Valid state properties:', Object.keys(this.state));
      return;
    }

    const oldState = { ...this.state };
    this.state = { ...this.state, ...newState };
    this.onStateChange(oldState, this.state);
    this.scheduleRender();
  }

  getState(key) {
    return key ? this.state[key] : this.state;
  }

  onStateChange(oldState, newState) {
    // Override in child classes to react to state changes
  }

  // Store integration methods
  subscribeToStore(store, callback) {
    if (!store || typeof store.subscribe !== 'function') {
      console.warn('Invalid store provided to subscribeToStore');
      return;
    }

    const unsubscribe = store.subscribe((state) => {
      if (!this.isDestroyed) {
        callback.call(this, state);
      }
    });

    this.storeSubscriptions.set(store, unsubscribe);
    return unsubscribe;
  }

  subscribeToStores() {
    // Override in child classes to set up store subscriptions
    // Example:
    // this.subscribeToStore(store, (state) => {
    //   this.setState({ data: state.data });
    // });
  }

  // Event handling
  addListener(element, event, handler, options = {}) {
    const boundHandler = handler.bind(this);
    element.addEventListener(event, boundHandler, options);

    if (!this.eventListeners.has(element)) {
      this.eventListeners.set(element, []);
    }
    this.eventListeners.get(element).push({ event, handler: boundHandler, options });

    return boundHandler;
  }

  addGlobalEventListeners() {
    // Override in child classes to set up global/persistent event listeners
    // Called once when component connects to DOM
    // Example:
    // this.addEventListener(window, 'resize', this.handleResize);
    // this.addEventListener(document, 'click', this.handleOutsideClick);
  }

  addEventListeners() {
    // Override in child classes to set up template-based event listeners
    // Called after every render for elements inside the component's innerHTML
    // Example:
    // const button = this.$('.my-button');
    // if (button) {
    //   this.addListener(button, 'click', this.handleClick);
    // }
  }

  clearEventListeners() {
    // Remove listeners from elements that are inside the component's innerHTML
    // This is called before each render to prevent duplicate listeners
    const elementsToRemove = [];
    this.eventListeners.forEach((listeners, element) => {
      if (this.contains(element) && element !== this) {
        listeners.forEach(({ event, handler, options }) => {
          try {
            element.removeEventListener(event, handler, options);
          } catch (error) {
            console.error('❌ Error removing listener:', error);
          }
        });
        elementsToRemove.push(element);
      }
    });

    // Remove cleared elements from the map
    elementsToRemove.forEach(element => {
      this.eventListeners.delete(element);
    });
  }

  // API methods - SIMPLIFIED: normal setState behavior
  async fetchData(endpoint, options = {}) {
    // this.setState({ isLoading: true });

    try {
      // const response = await fetch(url, {
      //   headers: {
      //     'Content-Type': 'application/json',
      //     ...options.headers
      //   },
      //   ...options
      // });
      let response;
      const method = (options.method || 'GET').toUpperCase();
      if (method.toUpperCase() === 'POST') {
        response = await api.post(endpoint, options.body || {}, options.headers);
      } else if (method.toUpperCase() === 'GET') {
        // For GET, use params instead of body
        response = await api.get(endpoint, options.params || {}, options.headers);
      }

      // if (!response.ok) {
      //   throw new Error(`HTTP error! status: ${response.status}`);
      // }
      //
      // const data = await response.json();
      // this.setState({ isLoading: false });
      return response;
    } catch (error) {
      this.setState({ isLoading: false });
      this.onApiError(error);
      throw error;
    }
  }

  onApiError(error) {
    // Override in child classes to handle API errors
    console.error('API Error:', error);
  }

  // Rendering with batching - this handles the performance optimization
  scheduleRender() {
    if (this.isDestroyed || this.renderScheduled) return;

    this.renderScheduled = true;
    // Use microtask to batch multiple state updates
    Promise.resolve().then(() => {
      if (!this.isDestroyed) {
        this.render();
      }
      this.renderScheduled = false;
    });
  }

  render() {
    console.log(`${logIcons.render}render`);
    if (this.isDestroyed) return;
    this.clearEventListeners();
    this.innerHTML = this.template();
    this.onAfterRender();
    this.addEventListeners();
    // this.onAfterRender();
  }

  onAfterRender() {
    // Override in child classes for post-render logic
  }

  // Utility methods
  $(selector) {
    return this.querySelector(selector);
  }

  $$(selector) {
    return this.querySelectorAll(selector);
  }

  getAttr(name, defaultValue = '') {
    return this.getAttribute(name) || defaultValue;
  }

  isLoading() {
    return this.state.isLoading;
  }

  // Custom event dispatching
  dispatch(eventName, detail = {}) {
    this.dispatchEvent(new CustomEvent(eventName, {
      detail,
      bubbles: true,
      composed: true
    }));
  }

  // Conditional CSS classes
  classIf(condition, className) {
    return condition ? className : '';
  }

  // Debug helper
  debug(message, data) {
    if (this.getAttr('debug') === 'true') {
      console.log(`[${this.constructor.name}] ${message}`, data || '');
    }
  }

  // Cleanup
  cleanup() {
    this.debug('Cleaning up component');
    this.isDestroyed = true;

    // Unsubscribe from stores
    this.storeSubscriptions.forEach((unsubscribe) => {
      if (typeof unsubscribe === 'function') {
        try {
          unsubscribe();
        } catch (error) {
          console.warn('Error during store unsubscription:', error);
        }
      }
    });
    this.storeSubscriptions.clear();

    // Remove event listeners
    this.eventListeners.forEach((listeners, element) => {
      listeners.forEach(({ event, handler, options }) => {
        try {
          element.removeEventListener(event, handler, options);
        } catch (error) {
          console.warn('Error removing event listener:', error);
        }
      });
    });
    this.eventListeners.clear();
  }
}