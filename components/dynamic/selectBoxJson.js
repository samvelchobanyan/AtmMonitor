import { DynamicElement } from '../../core/dynamic-element.js';
import '../dynamic/select-box.js';

const proxyAttrs = [
  'name',
  'value',
  'multiple',
  'searchable',
  'tag-mode',
  'class',
  'data-max-items',
  'data-empty-message'
];

export default class SelectBoxJson extends DynamicElement {
  static get observedAttributes() {
    return ['options', ...proxyAttrs];
  }

  constructor() {
    super();
    this.selectBox = null;
  }

  template() {
    return `<select-box></select-box>`;
  }

  onAfterRender() {
    this.selectBox = this.querySelector('select-box');
    if (!this.selectBox) return;

    this._applyAttributes();
    this._buildOptions();
    this.addListener(this.selectBox, 'change', (e) => {
      this.setAttribute('value', e.target.value);
      this.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (name !== 'value') {
      super.attributeChangedCallback(name, oldVal, newVal);
    }
    if (this.selectBox) {
      if (name === 'options') {
        this._buildOptions();
      } else {
        if (newVal === null) {
          this.selectBox.removeAttribute(name);
        } else {
          this.selectBox.setAttribute(name, newVal);
        }
      }
    }
  }

  _applyAttributes() {
    proxyAttrs.forEach(attr => {
      if (this.hasAttribute(attr)) {
        this.selectBox.setAttribute(attr, this.getAttribute(attr));
      }
    });
    if (this.hasAttribute('value')) {
      this.selectBox.setAttribute('value', this.getAttribute('value'));
    }
  }

  _buildOptions() {
    if (!this.selectBox) return;
    const raw = this.getAttribute('options') || '[]';
    let data = [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        data = parsed;
      }
    } catch (e) {
      console.warn('Invalid JSON for <select-box-json> options:', e);
    }
    const wrapper = this.selectBox.querySelector('.combo-box-options');
    if (!wrapper) return;
    wrapper.innerHTML = '';
    data.forEach(opt => {
      const div = document.createElement('div');
      div.className = 'combo-option';
      div.setAttribute('data-option-value', opt.value);
      if (opt.selected) div.classList.add('selected');
      div.textContent = opt.label;
      wrapper.appendChild(div);
    });
    // Re-import options for select-box internal tracking
    if (typeof this.selectBox._importOptions === 'function') {
      this.selectBox._importOptions();
      this.selectBox._initSelection();
    }
  }
}

customElements.define('select-box-json', SelectBoxJson);
