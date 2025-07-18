import { DynamicElement } from '../../core/dynamic-element.js';
import './select-box.js';

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

  _parseOptions() {
    const raw = this.getAttribute('options') || '[]';
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('Invalid JSON for <select-box-json> options:', e);
      return [];
    }
  }

  _passthroughAttrs() {
    return proxyAttrs
      .filter(attr => this.hasAttribute(attr))
      .map(attr => {
        const val = this.getAttribute(attr);
        if (val === '' || val === 'true') return attr;
        return `${attr}="${val}"`;
      })
      .join(' ');
  }

  _renderOptions() {
    return this._parseOptions()
      .map(opt => {
        const sel = opt.selected ? ' selected' : '';
        return `<div class="combo-option${sel}" data-option-value="${opt.value}">${opt.label}</div>`;
      })
      .join('');
  }

  template() {
    return `<select-box ${this._passthroughAttrs()}>${this._renderOptions()}</select-box>`;
  }

  onAfterRender() {
    this.selectBox = this.querySelector('select-box');
    if (!this.selectBox) return;
    this.addListener(this.selectBox, 'change', e => {
      this.setAttribute('value', e.target.getAttribute('value'));
      this.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (this.selectBox && name === 'value') {
      this.selectBox.setAttribute('value', newVal);
      return;
    }
    super.attributeChangedCallback(name, oldVal, newVal);
  }
}

customElements.define('select-box-json', SelectBoxJson);
