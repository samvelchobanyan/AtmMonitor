const comboTemplate = document.createElement('template');
comboTemplate.innerHTML = `
  <div class="combo-box-selected">
    <div class="combo-box-selected-wrap">
      <slot name="placeholder">Select...</slot>
    </div>
  </div>
  <div class="combo-box-dropdown">
    <div class="combo-box-options">
      <slot name="options"></slot>
    </div>
  </div>
`;

class ComboBox extends HTMLElement {
  static get observedAttributes() {
    return ['data-combo-name', 'data-combo-value', 'data-max-items', 'data-empty-message', 'multiple', 'searchable', 'class'];
  }

  constructor() {
    super();
    // Instantiate template into light DOM
    this.appendChild(comboTemplate.content.cloneNode(true));

    // Element references
    this._selectedEl = this.querySelector('.combo-box-selected');
    this._dropdownEl = this.querySelector('.combo-box-dropdown');
    this._optionsWrapper = this.querySelector('.combo-box-options');
    this._currentTabIndex = -1;
    this._multiData = [];
    this._emptyMessage = this.getAttribute('data-empty-message') || 'Nothing found';
    this._maxItemsShow = Number(this.getAttribute('data-max-items')) || 3;

    // Bind handlers
    this._onDocumentClick = this._onDocumentClick.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
  }

  connectedCallback() {
    // Move light-DOM options into our dropdown
    this._importOptions();
    this._initSelection();

    // Events
    this._selectedEl.addEventListener('click', e => { e.stopPropagation(); this.toggleDropdown(); });
    this.addEventListener('click', e => this._onOptionClick(e));
    if (this.hasAttribute('searchable')) this._insertSearchInput();

    document.addEventListener('click', this._onDocumentClick);
    this.addEventListener('keydown', this._onKeyDown);
    this.setAttribute('tabindex', 0);
  }

  disconnectedCallback() {
    document.removeEventListener('click', this._onDocumentClick);
    this.removeEventListener('keydown', this._onKeyDown);
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (name === 'data-combo-value') this._syncValue(newVal);
    if (name === 'data-empty-message') this._emptyMessage = newVal;
    if (name === 'data-max-items') this._maxItemsShow = Number(newVal) || this._maxItemsShow;
  }

  // Sync the displayed selection when attribute changes externally
  _syncValue(newVal) {
    const opts = Array.from(this._optionsWrapper.querySelectorAll('.combo-option'));
    const single = !this.classList.contains('multiple');
    if (single) {
      opts.forEach(o => {
        if (o.getAttribute('data-option-value') === newVal) {
          this._selectSingle(o);
        } else {
          o.classList.remove('selected');
        }
      });
    } else {
      const values = newVal.split(',').map(v => v.trim());
      this._multiData = [];
      opts.forEach(o => {
        const val = o.getAttribute('data-option-value');
        if (values.includes(val)) {
          o.classList.add('selected');
          this._multiData.push({ value: val, text: o.textContent.trim() });
        } else {
          o.classList.remove('selected');
        }
      });
      this._updateMultiDisplay();
    }
  }

  _importOptions() {
    const slotOptions = Array.from(this.querySelectorAll('.combo-option'));
    slotOptions.forEach(opt => this._optionsWrapper.appendChild(opt));
  }

  _initSelection() {
    const single = !this.classList.contains('multiple');
    const initial = this.getAttribute('data-combo-value');
    const opts = Array.from(this._optionsWrapper.querySelectorAll('.combo-option'));
    opts.forEach(o => o.classList.remove('selected'));
    if (single) {
      const sel = opts.find(o => o.getAttribute('data-option-value') === initial) || opts.find(o => o.classList.contains('selected'));
      if (sel) this._selectSingle(sel);
    } else {
      opts.filter(o => o.classList.contains('selected')).forEach(o => this._addMultiData(o));
      this._updateMultiDisplay();
    }
  }

  toggleDropdown() {
    const open = this._dropdownEl.classList.toggle('opened');
    this._selectedEl.classList.toggle('active', open);
    if (open && this.hasAttribute('searchable')) this._insertSearchInput();
  }

  _onDocumentClick(e) {
    if (!this.contains(e.target) && this._dropdownEl.classList.contains('opened')) {
      this._closeDropdown();
    }
  }

  _onKeyDown(e) {
    // TODO: implement arrow navigation, enter, esc, backspace as needed
  }

  _onOptionClick(e) {
    const opt = e.target.closest('.combo-option');
    if (!opt) return;
    if (this.classList.contains('multiple')) {
      if (opt.classList.contains('selected')) this._removeMultiOption(opt);
      else { this._selectOption(opt); this._addMultiData(opt); }
      this._updateMultiDisplay();
    } else {
      this._selectSingle(opt);
      this._closeDropdown();
    }
  }

  _selectOption(opt) {
    if (!this.classList.contains('multiple')) {
      this._optionsWrapper.querySelectorAll('.combo-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
    } else {
      opt.classList.add('selected');
    }
  }

  _selectSingle(opt) {
    const val = opt.getAttribute('data-option-value');
    this.setAttribute('data-combo-value', val);
    this.querySelector('.combo-box-selected-wrap').innerHTML = opt.innerHTML;
  }

  _addMultiData(opt) {
    const val = opt.getAttribute('data-option-value');
    const txt = opt.textContent.trim();
    this._multiData.push({ value: val, text: txt });
  }

  _removeMultiOption(opt) {
    opt.classList.remove('selected');
    const val = opt.getAttribute('data-option-value');
    this._multiData = this._multiData.filter(item => item.value !== val);
  }

  _updateMultiDisplay() {
    const wrap = this.querySelector('.combo-box-selected-wrap');
    if (this.classList.contains('tag-mode')) {
      wrap.innerHTML = this._multiData.map(d => `<span class="combo-box-tag" data-tag-value="${d.value}">${d.text}</span>`).join('');
    } else {
      const texts = this._multiData.map(d => d.text);
      wrap.textContent = texts.length > this._maxItemsShow
          ? `${texts.slice(0, this._maxItemsShow).join(', ')} +${texts.length - this._maxItemsShow}`
          : texts.join(', ');
    }
    this.setAttribute('data-combo-value', this._multiData.map(d => d.value).join(', '));
  }

  _closeDropdown() {
    this._dropdownEl.classList.remove('opened');
    this._selectedEl.classList.remove('active');
    const inp = this.querySelector('input.combo-box-search'); if (inp) inp.remove();
  }

  _insertSearchInput() {
    if (!this.querySelector('input.combo-box-search')) {
      const input = document.createElement('input');
      input.type = 'text'; input.className = 'combo-box-search';
      this._selectedEl.appendChild(input);
      input.focus();
      input.addEventListener('input', e => this._filterOptions(e.target.value));
    }
  }

  _filterOptions(query) {
    const q = query.trim().toLowerCase();
    const opts = Array.from(this._optionsWrapper.querySelectorAll('.combo-option'));
    opts.forEach(o => o.classList.toggle('combo-option_hidden', q && !o.textContent.toLowerCase().includes(q)));
    if (!opts.some(o => !o.classList.contains('combo-option_hidden'))) {
      if (!this._optionsWrapper.querySelector('.combo-box-message')) {
        const msg = document.createElement('div'); msg.className = 'combo-box-message'; msg.textContent = this._emptyMessage;
        this._optionsWrapper.append(msg);
      }
    } else {
      const msg = this._optionsWrapper.querySelector('.combo-box-message'); if (msg) msg.remove();
    }
  }
}

customElements.define('combo-box', ComboBox);