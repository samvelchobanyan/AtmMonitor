import { api } from "./api-client.js";
import { store } from "./store/store.js";
const logIcons = {
    info: "💡",
    success: "✅",
    warning: "⚠️",
    error: "❌",
    loading: "🔄",
    api: "📡",
    chart: "📊",
    user: "👤",
    data: "💾",
    render: "🎨",
};

export class DynamicElement extends HTMLElement {
    constructor() {
        super();

        // Internal state
        this.state = { isLoading: false, error: false };
        this.eventListeners = new Map();
        this.isDestroyed = false;
        this.renderScheduled = false;
        this.unsubscribeFromStore = null;
    }

    // Define which attributes to observe - override in child classes
    static get observedAttributes() {
        return [];
    }

    static get nonRenderingAttributes() {
        return new Set(); // No attributes blacklisted by default
    }

    connectedCallback() {
        if (store.getState().appReady) {
            this.runComponentLifecycle();
        } else {
            this.delayedInit = store.subscribe((state) => {
                if (state.appReady) {
                    this.delayedInit?.(); // unsubscribe
                    this.delayedInit = null; // Prevent future calls
                    this.runComponentLifecycle();
                }
            });
        }
    }

    runComponentLifecycle() {
        this.onConnected();
        this.addGlobalEventListeners();

        if (
            typeof this.onStoreChange === "function" &&
            this.onStoreChange !== DynamicElement.prototype.onStoreChange
        ) {
            this.subscribeToStore(this.onStoreChange);
        }

        this.scheduleRender();
    }

    disconnectedCallback() {
        this.onDisconnected();
        this.cleanup();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.onAttributeChange(name, oldValue, newValue);

            if (!this.constructor.nonRenderingAttributes.has(name)) {
                this.scheduleRender();
            }
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
        return "<div>Override template() method</div>";
    }

    // State management - SIMPLIFIED: always triggers render
    setState(newState) {
        if (this.isDestroyed) return;
        // Simple validation - check if properties exist in current state
        const invalidKeys = Object.keys(newState).filter((key) => !(key in this.state));
        if (invalidKeys.length > 0) {
            console.warn(
                `[${this.constructor.name}] Setting undefined state properties:`,
                invalidKeys
            );
            console.warn("Valid state properties:", Object.keys(this.state));
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
    subscribeToStore(callback) {
        if (!store || typeof store.subscribe !== "function") {
            console.warn("Invalid store provided to subscribeToStore");
            return;
        }

        this.unsubscribeFromStore = store.subscribe((state) => {
            if (!this.isDestroyed) {
                callback.call(this, state);
            }
        });
    }

    onStoreChange(state) {
        // Optional — only override if you want to subscribe
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
                        console.error("❌ Error removing listener:", error);
                    }
                });
                elementsToRemove.push(element);
            }
        });

        // Remove cleared elements from the map
        elementsToRemove.forEach((element) => {
            this.eventListeners.delete(element);
        });
    }

    // API methods - SIMPLIFIED: normal setState behavior
    async fetchData(endpoint, options = {}) {
        try {
            let response;
            const method = (options.method || "GET").toUpperCase();
            if (method.toUpperCase() === "POST") {
                response = await api.post(endpoint, options.body || {}, options.headers);
            } else if (method.toUpperCase() === "GET") {
                // For GET, use params instead of body
                response = await api.get(endpoint, options.params || {}, options.headers);
            }
            return response;
        } catch (error) {
            this.setState({ isLoading: false });
            this.onApiError(error);
            throw error;
        }
    }

    onApiError(error) {
        // Override in child classes to handle API errors
        console.error("API Error:", error);
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
        // console.log(`${logIcons.render}[${this.tagName}]render`);
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

    getAttr(name, defaultValue = "") {
        return this.getAttribute(name) || defaultValue;
    }

    isLoading() {
        return this.state.isLoading;
    }

    // Custom event dispatching
    dispatch(eventName, detail = {}) {
        this.dispatchEvent(
            new CustomEvent(eventName, {
                detail,
                bubbles: true,
                composed: true,
            })
        );
    }

    // Utility: Conditionally render an attribute if the value is defined (and not null)
    attrIf(name, value) {
        return value !== undefined && value !== null ? `${name}="${String(value)}"` : "";
    }

    // Conditional CSS classes
    classIf(condition, className) {
        return condition ? className : "";
    }

    // Debug helper
    debug(message, data) {
        if (this.getAttr("debug") === "true") {
            console.log(`[${this.constructor.name}] ${message}`, data || "");
        }
    }

    // Cleanup
    cleanup() {
        this.debug("Cleaning up component");
        this.isDestroyed = true;

        // Unsubscribe from stores
        if (typeof this.unsubscribeFromStore === "function") {
            try {
                this.unsubscribeFromStore();
            } catch (err) {
                console.warn("Error during store unsubscribe", err);
            }
            this.unsubscribeFromStore = null;
        }

        // Remove event listeners
        this.eventListeners.forEach((listeners, element) => {
            listeners.forEach(({ event, handler, options }) => {
                try {
                    element.removeEventListener(event, handler, options);
                } catch (error) {
                    console.warn("Error removing event listener:", error);
                }
            });
        });
        this.eventListeners.clear();

        if (typeof this.delayedInit === "function") {
            try {
                this.delayedInit();
            } catch {}
            this.delayedInit = null;
        }
    }
}
