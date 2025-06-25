// src/core/base-element.js

export class BaseElement extends HTMLElement {
    constructor() {
      super();
    }
  
    // override in subclasses to list attributes to watch
    static get properties() {
      return [];
    }
  
    static get observedAttributes() {
      return this.properties;
    }
  
    attributeChangedCallback(name, oldValue, newValue) {
      this.render();
    }
  
    connectedCallback() {
      this.render();
    }
  
    // subclasses must override
    render() {
      // e.g. this.innerHTML = '…';
    }
  }
  