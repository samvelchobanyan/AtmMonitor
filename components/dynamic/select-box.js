/* select-box.js — Slot-less, full-featured <select-box> Web Component */

const selectTemplate = document.createElement('template');
selectTemplate.innerHTML = `
  <div class="combo-box-selected" role="button" aria-haspopup="listbox">
    <div class="combo-box-selected-wrap"></div>
  </div>
  <div class="combo-box-dropdown" role="listbox">
    <div class="combo-box-options"></div>
  </div>
`;

class SelectBox extends HTMLElement {
  static get observedAttributes() {
    return [
      'name',
      'value',
      'data-max-items',
      'data-empty-message',
      'multiple',
      'searchable',
      'tag-mode',
      'class'
    ];
  }

  // — Attribute ↔ Property sync with single change dispatch —
  get value() {
    return this.getAttribute('value');
  }
  set value(v) {
    if (this.getAttribute('value') === v) return;
    this.setAttribute('value', v);
    // Only here we emit one change event
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  get name() {
    return this.getAttribute('name');
  }
  set name(n) {
    this.setAttribute('name', n);
  }

  constructor() {
    super();
    this.classList.add('combo-box');
    this.appendChild(selectTemplate.content.cloneNode(true));

    this._selectedEl     = this.querySelector('.combo-box-selected');
    this._dropdownEl     = this.querySelector('.combo-box-dropdown');
    this._optionsWrapper = this.querySelector('.combo-box-options');

    this._options      = [];
    this._searchInput  = null;
    this._multiData    = [];
    this._emptyMessage = this.getAttribute('data-empty-message') || 'Nothing found';
    this._maxItemsShow = Number(this.getAttribute('data-max-items')) || 3;
    this._currentTabIndex = -1;
    this._optionsAttr = JSON.parse(this.getAttribute('options')) || null;

    // bind handlers
    this._onDocumentClick   = this._onDocumentClick.bind(this);
    this._onOptionClick     = this._onOptionClick.bind(this);
    this._toggleDropdown    = this._toggleDropdown.bind(this);
    this._handleSearchKeyUp = this._handleSearchKeyUp.bind(this);
  }

  connectedCallback() {
    const attrs = {};
    for (const attr of this.attributes) {
      attrs[attr.name] = attr.value;
    }
    // mirror boolean attrs → CSS classes
    ['multiple','searchable','tag-mode'].forEach(attr =>
        this.classList.toggle(attr, this.hasAttribute(attr))
    );

    // this._importOptions();
    this._buildOptions();
    this._initSelection();

    // wire events
    this._selectedEl.addEventListener('click', this._toggleDropdown);
    this.addEventListener('click', this._onOptionClick);
    document.addEventListener('click', this._onDocumentClick);
    this.addEventListener('keyup', this._handleSearchKeyUp);

    this.setAttribute('tabindex','0');
  }

  disconnectedCallback() {
    // remove all paired listeners
    this._selectedEl.removeEventListener('click', this._toggleDropdown);
    this.removeEventListener('click', this._onOptionClick);
    document.removeEventListener('click', this._onDocumentClick);
    this.removeEventListener('keyup', this._handleSearchKeyUp);
  }

  attributeChangedCallback(attr, oldVal, newVal) {
    if (oldVal === newVal) return;
    switch (attr) {
      case 'value':
        this._syncValue(newVal);
        break;
      case 'data-empty-message':
        this._emptyMessage = newVal;
        break;
      case 'data-max-items':
        this._maxItemsShow = Number(newVal) || this._maxItemsShow;
        break;
      case 'multiple':
      case 'searchable':
      case 'tag-mode':
        this.classList.toggle(attr, this.hasAttribute(attr));
        break;
      case 'class':
        if (!this.classList.contains('combo-box')) {
          this.classList.add('combo-box');
        }
        break;
        // name change is implicitly handled by the getter
    }
  }

  // — Import any initial .combo-option children into the dropdown —
  _importOptions() {
    this._options = Array.from(this.querySelectorAll('.combo-option'));
    this._options.forEach(opt => this._optionsWrapper.appendChild(opt));
  }

  _buildOptions(){
    if(this._optionsAttr){
      this._options = this._optionsAttr.map(opt => {
        const optEl = document.createElement('div');
        optEl.className = 'combo-option';
        optEl.setAttribute('data-option-value', opt.value);
        if (opt.selected) optEl.classList.add('selected');
        optEl.textContent = opt.label;
        this._optionsWrapper.appendChild(optEl);
        return optEl
      })
    }

  }

  // — Initialize selection based on `value` or existing .selected —
  _initSelection() {
    const initial = this.value;
    this._options.forEach(o => o.classList.remove('selected'));

    if (!this.hasAttribute('multiple')) {
      const sel = this._options
          .find(o => o.getAttribute('data-option-value') === initial)
          || this._options.find(o => o.classList.contains('selected'));
      if (sel) this._selectSingle(sel);
    } else {
      this._options
      .filter(o => o.classList.contains('selected'))
      .forEach(o => this._multiData.push({
        value: o.getAttribute('data-option-value'),
        text:  o.textContent.trim()
      }));
      this._updateMultiDisplay();
    }
  }

  // — Sync external `value` changes back into the UI —
  _syncValue(newVal) {
    if (!this.hasAttribute('multiple')) {
      this._options.forEach(o => {
        if (o.getAttribute('data-option-value') === newVal) {
          this._selectSingle(o);
        } else {
          o.classList.remove('selected');
        }
      });
    } else {
      const vals = newVal.split(',').map(v => v.trim());
      this._multiData = [];
      this._options.forEach(o => {
        const v = o.getAttribute('data-option-value');
        if (vals.includes(v)) {
          o.classList.add('selected');
          this._multiData.push({ value: v, text: o.textContent.trim() });
        } else {
          o.classList.remove('selected');
        }
      });
      this._updateMultiDisplay();
    }
  }

  // — Open/close dropdown & manage search injection —
  _toggleDropdown(e) {
    e.stopPropagation();
    const isOpen = this._dropdownEl.classList.toggle('opened');
    this._selectedEl.classList.toggle('active', isOpen);

    if (isOpen && this.hasAttribute('searchable')) {
      if (!this._searchInput) {
        this._searchInput = document.createElement('input');
        this._searchInput.type      = 'text';
        this._searchInput.className = 'combo-box-search';
        this._selectedEl.appendChild(this._searchInput);
        this._searchInput.focus();
      }
      this._filterOptionsWithQuery({ target: this._searchInput });
    }
    if (!isOpen) {
      this._closeDropdown();
    }
  }

  _onDocumentClick(e) {
    if (!this.contains(e.target)) {
      this._closeDropdown();
    }
  }

  _closeDropdown() {
    this._dropdownEl.classList.remove('opened');
    this._selectedEl.classList.remove('active');
    if (this._searchInput) {
      this._searchInput.remove();
      this._searchInput = null;
    }
    this._options.forEach(o => o.classList.remove('combo-option_hidden'));
    const msg = this._optionsWrapper.querySelector('.combo-box-message');
    if (msg) msg.remove();
  }

  // — Handle option clicks for single & multiple modes —
  _onOptionClick(e) {
    const opt = e.target.closest('.combo-option');
    if (!opt) return;

    if (this.hasAttribute('multiple')) {
      if (opt.classList.contains('selected')) {
        this._removeMultiOption(opt);
      } else {
        this._selectOption(opt);
        this._addMultiData(opt);
      }
      this._updateMultiDisplay();
    } else {
      this._selectSingle(opt);
      this._closeDropdown();
    }
  }

  _selectSingle(opt) {
    const val = opt.getAttribute('data-option-value');
    this._options.forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected');
    this.querySelector('.combo-box-selected-wrap').innerHTML = opt.innerHTML;
    // Note: no dispatch here; setter handles it
    this.value = val;
  }

  _selectOption(opt) {
    if (!this.hasAttribute('multiple')) {
      this._options.forEach(o => o.classList.remove('selected'));
    }
    opt.classList.add('selected');
  }

  _addMultiData(opt) {
    this._multiData.push({
      value: opt.getAttribute('data-option-value'),
      text:  opt.textContent.trim()
    });
  }

  _removeMultiOption(opt) {
    const val = opt.getAttribute('data-option-value');
    opt.classList.remove('selected');
    this._multiData = this._multiData.filter(item => item.value !== val);
  }

  _updateMultiDisplay() {
    const wrap  = this.querySelector('.combo-box-selected-wrap');
    const texts = this._multiData.map(d => d.text);

    if (this.hasAttribute('tag-mode')) {
      wrap.innerHTML = this._multiData
      .map(d => `<span class="combo-box-tag" data-tag-value="${d.value}">${d.text}</span>`)
      .join('');
    } else {
      wrap.textContent = texts.length > this._maxItemsShow
          ? `${texts.slice(0, this._maxItemsShow).join(', ')} +${texts.length - this._maxItemsShow}`
          : texts.join(', ');
    }

    // Setter will fire the change event exactly once
    this.value = this._multiData.map(d => d.value).join(',');
  }

  // — Search/filter logic —
  _handleSearchKeyUp(e) {
    if (!e.target.classList.contains('combo-box-search')) return;
    this._filterOptionsWithQuery(e);
  }

  _filterOptionsWithQuery(e) {
    const raw = e.target.value.trim().toUpperCase();
    this._options.forEach(option => {
      const txt = option.textContent.toUpperCase();
      option.classList.toggle('combo-option_hidden', !txt.includes(raw));
    });

    const noneVisible = !this._options.some(o => !o.classList.contains('combo-option_hidden'));
    let msg = this._optionsWrapper.querySelector('.combo-box-message');
    if (noneVisible) {
      if (!msg) {
        msg = document.createElement('div');
        msg.className   = 'combo-box-message';
        msg.textContent = this._emptyMessage;
        this._optionsWrapper.appendChild(msg);
      }
    } else if (msg) {
      msg.remove();
    }
  }
}

customElements.define('select-box', SelectBox);
