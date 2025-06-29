class DynamicComponent extends HTMLElement {
  constructor() {
    super();
    
    // Internal state
    this.state = { isLoading: false };
    this.storeSubscriptions = new Map();
    this.eventListeners = new Map();
    this.isDestroyed = false;
  }

  connectedCallback() {
    this.onMount();
    this.render();
    this.setupEventListeners();
    this.subscribeToStores();
  }

  disconnectedCallback() {
    this.onUnmount();
    this.cleanup();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.onAttributeChange(name, oldValue, newValue);
      if (!this.isDestroyed) {
        this.render();
      }
    }
  }

  // Lifecycle hooks - override in child classes
  onMount() {
    // Called when component is added to DOM
  }

  onUnmount() {
    // Called when component is removed from DOM
  }

  onAttributeChange(name, oldValue, newValue) {
    // Called when attributes change
  }

  // Override this method in child classes to define the HTML template
  template() {
    return '<div>Override template() method</div>';
  }

  // State management
  setState(newState) {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...newState };
    this.onStateChange(oldState, this.state);
    if (!this.isDestroyed) {
      this.render();
    }
  }

  getState(key) {
    return key ? this.state[key] : this.state;
  }

  onStateChange(oldState, newState) {
    // Override in child classes to react to state changes
  }

  // Store integration methods
  connectToStore(store, callback) {
    if (!store || typeof store.subscribe !== 'function') {
      console.warn('Invalid store provided to connectToStore');
      return;
    }

    const unsubscribe = store.subscribe((storeState) => {
      if (!this.isDestroyed) {
        callback.call(this, storeState);
      }
    });

    this.storeSubscriptions.set(store, unsubscribe);
    return unsubscribe;
  }

  subscribeToStores() {
    // Override in child classes to set up store subscriptions
    // Example:
    // this.connectToStore(userStore, (state) => {
    //   this.setState({ user: state.user });
    // });
  }

  // Event handling
  addEventListener(element, event, handler, options = {}) {
    const boundHandler = handler.bind(this);
    element.addEventListener(event, boundHandler, options);
    
    if (!this.eventListeners.has(element)) {
      this.eventListeners.set(element, []);
    }
    this.eventListeners.get(element).push({ event, handler: boundHandler, options });
  }

  setupEventListeners() {
    // Override in child classes to set up event listeners
  }

  // API methods
  async fetchData(url, options = {}) {
    this.setState({ isLoading: true });
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      this.setState({ isLoading: false });
      return data;
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

  // Rendering
  render() {
    if (this.isDestroyed) return;
    
    this.innerHTML = this.template();
    
    // Re-setup event listeners after render
    this.setupDOMEventListeners();
  }

  setupDOMEventListeners() {
    // Override in child classes to set up DOM event listeners after render
  }

  // Utility methods
  $(selector) {
    return this.querySelector(selector);
  }

  $(selector) {
    return this.querySelectorAll(selector);
  }

  getAttr(name, defaultValue = '') {
    return this.getAttribute(name) || defaultValue;
  }

  // Helper method to check loading state
  isLoading() {
    return this.state.isLoading;
  }

  emit(eventName, detail = {}) {
    this.dispatchEvent(new CustomEvent(eventName, {
      detail,
      bubbles: true,
      composed: true
    }));
  }

  // Cleanup
  cleanup() {
    this.isDestroyed = true;
    
    // Unsubscribe from stores
    this.storeSubscriptions.forEach((unsubscribe) => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    this.storeSubscriptions.clear();

    // Remove event listeners
    this.eventListeners.forEach((listeners, element) => {
      listeners.forEach(({ event, handler, options }) => {
        element.removeEventListener(event, handler, options);
      });
    });
    this.eventListeners.clear();
  }
}