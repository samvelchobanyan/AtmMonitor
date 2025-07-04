/* select-box.js — Slot-less, full-featured <select-box> Web Component
   - Renamed from ComboBox to SelectBox
   - Uses `name` and `value` attributes (no more `data-combo-*`)
   - Supports single, multiple, tag-mode, searchable, max-items, empty-message
*/

// 1. Define the template
const selectTemplate = document.createElement('template');
selectTemplate.innerHTML = `
  <div class="combo-box-selected">
    <div class="combo-box-selected-wrap"></div>
  </div>
  <div class="combo-box-dropdown">
    <div class="combo-box-options"></div>
  </div>
`;

class SelectBox extends HTMLElement {
  // 2. Observe these attributes
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

  // 3. Property accessors for convenience
  get value() {
    return this.getAttribute('value');
  }
  set value(v) {
    this.setAttribute('value', v);
  }
  get name() {
    return this.getAttribute('name');
  }
  set name(n) {
    this.setAttribute('name', n);
  }

  constructor() {
    super();
    // always have base class
    this.classList.add('combo-box');
    // stamp out template into light DOM
    this.appendChild(selectTemplate.content.cloneNode(true));

    // element refs
    this._selectedEl     = this.querySelector('.combo-box-selected');
    this._dropdownEl     = this.querySelector('.combo-box-dropdown');
    this._optionsWrapper = this.querySelector('.combo-box-options');

    // internal state
    this._options         = [];
    this._searchInput     = null;
    this._multiData       = [];
    this._emptyMessage    = this.getAttribute('data-empty-message') || 'Nothing found';
    this._maxItemsShow    = Number(this.getAttribute('data-max-items')) || 3;
    this._currentTabIndex = -1;

    // bind handlers
    this._onDocumentClick   = this._onDocumentClick.bind(this);
    this._onOptionClick     = this._onOptionClick.bind(this);
    this._toggleDropdown    = this._toggleDropdown.bind(this);
    this._handleSearchKeyUp = this._handleSearchKeyUp.bind(this);
  }

  connectedCallback() {
    // mirror boolean attrs → CSS classes
    this.classList.toggle('multiple',   this.hasAttribute('multiple'));
    this.classList.toggle('searchable', this.hasAttribute('searchable'));
    this.classList.toggle('tag-mode',   this.hasAttribute('tag-mode'));

    // import any light-DOM .combo-option elements
    this._importOptions();
    // initialize selection from value attr or existing .selected
    this._initSelection();

    // wire events
    this._selectedEl.addEventListener('click', this._toggleDropdown);
    this.addEventListener('click',            this._onOptionClick);
    document.addEventListener('click',        this._onDocumentClick);
    this.addEventListener('keyup',            this._handleSearchKeyUp);

    // make host focusable for potential keyboard nav
    this.setAttribute('tabindex','0');
  }

  disconnectedCallback() {
    document.removeEventListener('click', this._onDocumentClick);
    this.removeEventListener('keyup', this._handleSearchKeyUp);
  }

  attributeChangedCallback(attr, oldVal, newVal) {
    if (oldVal === newVal) return;
    switch (attr) {
      case 'value':
        this._syncValue(newVal);
        break;
      case 'name':
        // nothing special to do for name right now
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
    }
  }

  // — Core setup methods —

  _importOptions() {
    // move any .combo-option children into the dropdown container
    this._options = Array.from(
        this.querySelectorAll('.combo-option')
    );
    this._options.forEach(opt => this._optionsWrapper.appendChild(opt));
  }

  _initSelection() {
    const initial = this.value;
    this._options.forEach(o => o.classList.remove('selected'));

    if (!this.hasAttribute('multiple')) {
      // single-select
      const sel = this._options
          .find(o => o.getAttribute('data-option-value') === initial)
          || this._options.find(o => o.classList.contains('selected'));
      if (sel) this._selectSingle(sel);
    } else {
      // multi-select
      this._options
      .filter(o => o.classList.contains('selected'))
      .forEach(o => this._multiData.push({
        value: o.getAttribute('data-option-value'),
        text:  o.textContent.trim()
      }));
      this._updateMultiDisplay();
    }
  }

  _syncValue(newVal) {
    // sync external changes to `value`
    if (!this.hasAttribute('multiple')) {
      this._options.forEach(o => {
        if (o.getAttribute('data-option-value') === newVal) {
          this._selectSingle(o);
        } else {
          o.classList.remove('selected');
        }
      });
    } else {
      const values = newVal.split(',').map(v => v.trim());
      this._multiData = [];
      this._options.forEach(o => {
        const v = o.getAttribute('data-option-value');
        if (values.includes(v)) {
          o.classList.add('selected');
          this._multiData.push({ value: v, text: o.textContent.trim() });
        } else {
          o.classList.remove('selected');
        }
      });
      this._updateMultiDisplay();
    }
  }

  // — Dropdown & Search —

  _toggleDropdown(e) {
    e.stopPropagation();
    const isOpen = this._dropdownEl.classList.toggle('opened');
    this._selectedEl.classList.toggle('active', isOpen);

    if (isOpen && this.hasAttribute('searchable')) {
      // inject search input once
      if (!this._searchInput) {
        this._searchInput = document.createElement('input');
        this._searchInput.type      = 'text';
        this._searchInput.className = 'combo-box-search';
        this._selectedEl.appendChild(this._searchInput);
        this._searchInput.focus();
      }
      // reset filter
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

  // — Option selection —

  _onOptionClick(e) {
    const opt = e.target.closest('.combo-option');
    if (!opt) return;

    if (this.hasAttribute('multiple')) {
      // multi-select
      if (opt.classList.contains('selected')) {
        this._removeMultiOption(opt);
      } else {
        this._selectOption(opt);
        this._addMultiData(opt);
      }
      this._updateMultiDisplay();
    } else {
      // single-select
      this._selectSingle(opt);
      this._closeDropdown();
    }
  }

  _selectSingle(opt) {
    const val = opt.getAttribute('data-option-value');
    this._options.forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected');
    this.value = val;
    this.querySelector('.combo-box-selected-wrap').innerHTML = opt.innerHTML;
    this.dispatchEvent(new Event('change', { bubbles: true }));
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

    this.value = this._multiData.map(d => d.value).join(',');
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // — Original plugin’s search logic —

  _handleSearchKeyUp(e) {
    if (!e.target.classList.contains('combo-box-search')) return;
    this._filterOptionsWithQuery(e);
  }

  _filterOptionsWithQuery(e) {
    const raw = e.target.value;
    const val = raw.trim();
    const up  = val.toUpperCase();

    if (val.length) {
      this._options.forEach(option => {
        const txt = option.textContent.toUpperCase();
        if (txt.indexOf(up) > -1) {
          option.classList.remove('combo-option_hidden');
        } else {
          option.classList.add('combo-option_hidden');
        }
      });
    } else {
      this._options.forEach(option => {
        option.classList.remove('combo-option_hidden');
      });
    }

    // “Nothing found” message
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

// 4. Register as <select-box>
customElements.define('select-box', SelectBox);
