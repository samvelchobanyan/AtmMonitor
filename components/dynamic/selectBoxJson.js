import { DynamicElement } from '../../core/dynamic-element.js';

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
  }

  onConnected() {
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

  _parseValue(val) {
    if (!val) return [];
    return String(val)
      .split(',')
      .map(v => v.trim())
      .filter(v => v.length > 0);
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

  _updateValueAttribute() {
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

  template() {
    const searchInput = this.hasAttribute('searchable')
      ? '<div class="combo-box-search"><input type="text" /></div>'
      : '';
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
          ${searchInput}
          <div class="combo-box-options">${optionsHtml}</div>
        </div>
      </div>
    `;
  }

  addEventListeners() {
    const selected = this.$('.combo-box-selected');
    if (selected) this.addListener(selected, 'click', this.toggleDropdown);
    this.$$('.combo-option').forEach(opt => {
      this.addListener(opt, 'click', this.onOptionClick);
    });
    const search = this.$('.combo-box-search input');
    if (search) this.addListener(search, 'keyup', this.onSearchKeyUp);
  }

  toggleDropdown(e) {
    e.stopPropagation();
    const dd = this.$('.combo-box-dropdown');
    const sel = this.$('.combo-box-selected');
    const isOpen = dd.classList.toggle('opened');
    sel.classList.toggle('active', isOpen);
    if (isOpen && this.hasAttribute('searchable')) {
      const input = this.$('.combo-box-search input');
      if (input) {
        input.focus();
        this._filterOptions(input.value);
      }
    } else if (!isOpen) {
      this.closeDropdown();
    }
  }

  handleOutsideClick(e) {
    if (!this.contains(e.target)) {
      this.closeDropdown();
    }
  }

  closeDropdown() {
    const dd = this.$('.combo-box-dropdown');
    const sel = this.$('.combo-box-selected');
    if (dd) dd.classList.remove('opened');
    if (sel) sel.classList.remove('active');
    const input = this.$('.combo-box-search input');
    if (input) input.value = '';
    this._filterOptions('');
  }

  onOptionClick(e) {
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
    this.scheduleRender();
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  onSearchKeyUp(e) {
    this._filterOptions(e.target.value);
  }

  _filterOptions(query) {
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
