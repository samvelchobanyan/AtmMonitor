export class BaseElement extends HTMLElement {
  static get properties() { return []; }
  static get observedAttributes() { return this.properties; }

  connectedCallback() {
    this.render();
  }
  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal !== newVal) this.render();
  }

  // subclasses MUST implement:
  render() { /* this.innerHTML = … */ }
}