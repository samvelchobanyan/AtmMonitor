import { DynamicElement } from '../../core/dynamic-element.js';

// <select-box-json> is a lightweight alternative to <select-box>.
// Options are provided via JSON and the component supports
// "multiple" and "searchable" attributes much like the original.

export default class SelectBoxJson extends DynamicElement {
  static get observedAttributes() {
    return ['options', 'value', 'multiple', 'searchable'];
  }

  constructor() {
    super();
    this.optionsData = [];
    this.selectedValues = [];
    this._updatingValue = false;

    this.toggleDropdown = this.toggleDropdown.bind(this);
    this.handleOutsideClick = this.handleOutsideClick.bind(this);
    this.onOptionClick = this.onOptionClick.bind(this);
    this.onSearchKeyUp = this.onSearchKeyUp.bind(this);

    this.searchInput = null;
  }

  onConnected() {
    // Parse initial data and restore value when the component
    // is inserted into the DOM.
    this.optionsData = this._parseOptions();
    const attrVal = this.getAttribute('value');
    if (attrVal) {
      this.selectedValues = this._parseValue(attrVal);
    } else {
      this.selectedValues = this.optionsData
        .filter(o => o.selected)
        .map(o => String(o.value));
      if (this.selectedValues.length) {
        this._updateValueAttribute();
      }
    }
    document.addEventListener('click', this.handleOutsideClick);
  }

  onDisconnected() {
    document.removeEventListener('click', this.handleOutsideClick);
  }

  onAttributeChange(name, oldVal, newVal) {
    if (name === 'options') {
      this.optionsData = this._parseOptions();
    }
    if (name === 'value' && !this._updatingValue) {
      this.selectedValues = this._parseValue(newVal);
    }
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    this.onAttributeChange(name, oldVal, newVal);
    if (!(name === 'value' && this._updatingValue)) {
      this.scheduleRender();
    }
  }

  _parseValue(val) {
    if (!val) return [];
    return String(val)
      .split(',')
      .map(v => v.trim())
      .filter(v => v.length > 0);
  }

  _parseOptions() {
    // Parse the JSON "options" attribute into
    // an array of { value, label, selected } objects.
    const raw = this.getAttribute('options') || '[]';
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('Invalid JSON for <select-box-json> options:', e);
      return [];
    }
  }

  _updateValueAttribute() {
    // Update the host element's "value" attribute based on
    // the current selection. In multiple mode a comma separated
    // string is written. Internal updates are guarded to avoid
    // infinite attributeChangedCallback loops.
    const val = this.hasAttribute('multiple')
      ? this.selectedValues.join(',')
      : (this.selectedValues[0] || '');
    this._updatingValue = true;
    if (val || this.hasAttribute('value')) {
      this.setAttribute('value', val);
    }
    this._updatingValue = false;
  }

  _selectedLabel() {
    if (this.hasAttribute('multiple')) {
      return this.optionsData
        .filter(o => this.selectedValues.includes(String(o.value)))
        .map(o => o.label)
        .join(', ');
    }
    const opt = this.optionsData.find(o => this.selectedValues.includes(String(o.value)));
    return opt ? opt.label : '';
  }

  _updateDisplay() {
    const wrap = this.$('.combo-box-selected-wrap');
    if (wrap) {
      wrap.textContent = this._selectedLabel();
    }
  }

  template() {
    const optionsHtml = this.optionsData
      .map(opt => {
        const sel = this.selectedValues.includes(String(opt.value)) ? ' selected' : '';
        return `<div class="combo-option${sel}" data-option-value="${opt.value}">${opt.label}</div>`;
      })
      .join('');
    const classes = ['combo-box'];
    if (this.hasAttribute('multiple')) classes.push('multiple');
    if (this.hasAttribute('searchable')) classes.push('searchable');

    const label = this._selectedLabel();

    return `
      <div class="${classes.join(' ')}" tabindex="0">
        <div class="combo-box-selected">
          <div class="combo-box-selected-wrap">${label}</div>
        </div>
        <div class="combo-box-dropdown">
          <div class="combo-box-options">${optionsHtml}</div>
        </div>
      </div>
    `;
  }

  addEventListeners() {
    // Wire up DOM events after each render.
    const selected = this.$('.combo-box-selected');
    if (selected) this.addListener(selected, 'click', this.toggleDropdown);
    this.$$('.combo-option').forEach(opt => {
      this.addListener(opt, 'click', this.onOptionClick);
    });
  }

  toggleDropdown(e) {
    // Mirrors the behaviour of SelectBox._toggleDropdown.
    // Opens or closes the dropdown and injects a temporary
    // search input when "searchable" is present.
    e.stopPropagation();
    const dd  = this.$('.combo-box-dropdown');
    const sel = this.$('.combo-box-selected');
    const isOpen = dd.classList.toggle('opened');
    sel.classList.toggle('active', isOpen);

    if (isOpen && this.hasAttribute('searchable')) {
      if (!this.searchInput) {
        this.searchInput = document.createElement('input');
        this.searchInput.type = 'text';
        this.searchInput.className = 'combo-box-search';
        sel.appendChild(this.searchInput);
        this.addListener(this.searchInput, 'keyup', this.onSearchKeyUp);
        this.searchInput.focus();
      }
      this._filterOptions(this.searchInput.value);
    }
    if (!isOpen) {
      this.closeDropdown();
    }
  }

  handleOutsideClick(e) {
    if (!this.contains(e.target)) {
      this.closeDropdown();
    }
  }

  closeDropdown() {
    // Reset dropdown state and remove temporary search input
    // when the menu is closed.
    const dd  = this.$('.combo-box-dropdown');
    const sel = this.$('.combo-box-selected');
    if (dd) dd.classList.remove('opened');
    if (sel) sel.classList.remove('active');
    if (this.searchInput) {
      this.searchInput.remove();
      this.searchInput = null;
    }
    this._filterOptions('');
  }

  onOptionClick(e) {
    // Update selected values when an option is clicked.
    const opt = e.target.closest('.combo-option');
    if (!opt) return;
    const val = String(opt.getAttribute('data-option-value'));
    const idx = this.selectedValues.indexOf(val);

    if (this.hasAttribute('multiple')) {
      if (idx >= 0) {
        this.selectedValues.splice(idx, 1);
        opt.classList.remove('selected');
      } else {
        this.selectedValues.push(val);
        opt.classList.add('selected');
      }
    } else {
      this.selectedValues = [val];
      this.$$('.combo-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      this.closeDropdown();
    }

    this._updateValueAttribute();
    this._updateDisplay();
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  onSearchKeyUp(e) {
    // Filter visible options as the user types.
    this._filterOptions(e.target.value);
  }

  _filterOptions(query) {
    // Simple client-side filtering based on the option text.
    const raw = (query || '').trim().toUpperCase();
    const options = Array.from(this.$$('.combo-option'));
    options.forEach(option => {
      const text = option.textContent.toUpperCase();
      option.classList.toggle('combo-option_hidden', !text.includes(raw));
    });
    const noneVisible = !options.some(o => !o.classList.contains('combo-option_hidden'));
    let msg = this.$('.combo-box-message');
    if (noneVisible) {
      if (!msg) {
        msg = document.createElement('div');
        msg.className = 'combo-box-message';
        msg.textContent = this.getAttribute('data-empty-message') || 'Nothing found';
        this.$('.combo-box-options').appendChild(msg);
      }
    } else if (msg) {
      msg.remove();
    }
  }
}

customElements.define('select-box-json', SelectBoxJson);
