/* select-box.js — Slot-less combo-box with original search/filter logic */

// 1. Template
const comboTemplate = document.createElement('template');
comboTemplate.innerHTML = `
  <div class="combo-box-selected">
    <div class="combo-box-selected-wrap"></div>
  </div>
  <div class="combo-box-dropdown">
    <div class="combo-box-options"></div>
  </div>
`;

class ComboBox extends HTMLElement {
  static get observedAttributes() {
    return [
      'data-combo-name','data-combo-value','data-max-items',
      'data-empty-message','multiple','searchable','tag-mode','class'
    ];
  }

  constructor() {
    super();
    this.classList.add('combo-box');
    this.appendChild(comboTemplate.content.cloneNode(true));

    // Refs
    this._selectedEl     = this.querySelector('.combo-box-selected');
    this._dropdownEl     = this.querySelector('.combo-box-dropdown');
    this._optionsWrapper = this.querySelector('.combo-box-options');

    // State
    this._options         = [];   // will hold all .combo-option elements
    this._searchInput     = null; // injected when opened
    this._multiData       = [];
    this._emptyMessage    = this.getAttribute('data-empty-message') || 'Nothing found';
    this._maxItemsShow    = Number(this.getAttribute('data-max-items')) || 3;
    this._currentTabIndex = -1;

    // Bindings
    this._onDocumentClick   = this._onDocumentClick.bind(this);
    this._onOptionClick     = this._onOptionClick.bind(this);
    this._toggleDropdown    = this._toggleDropdown.bind(this);
    this._handleSearchKeyUp = this._handleSearchKeyUp.bind(this);
  }

  connectedCallback() {
    // Mirror attributes → CSS classes
    this.classList.toggle('multiple',   this.hasAttribute('multiple'));
    this.classList.toggle('searchable', this.hasAttribute('searchable'));
    this.classList.toggle('tag-mode',   this.hasAttribute('tag-mode'));

    // Pull in any light-DOM .combo-option nodes
    this._importOptions();
    // Initialize selected state
    this._initSelection();

    // Event wiring
    this._selectedEl.addEventListener('click', this._toggleDropdown);
    this.addEventListener('click', this._onOptionClick);
    document.addEventListener('click', this._onDocumentClick);

    // Watch for keyup (for search filtering)
    this.addEventListener('keyup', this._handleSearchKeyUp);

    // Make focusable for future nav
    this.setAttribute('tabindex','0');
  }

  disconnectedCallback() {
    document.removeEventListener('click', this._onDocumentClick);
    this.removeEventListener('keyup', this._handleSearchKeyUp);
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    switch (name) {
      case 'data-combo-value':
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
        this.classList.toggle(name, this.hasAttribute(name));
        break;
      case 'class':
        if (!this.classList.contains('combo-box')) {
          this.classList.add('combo-box');
        }
        break;
    }
  }

  // ——————————
  // Core setup
  // ——————————

  _importOptions() {
    // Grab existing .combo-option children, move into dropdown
    this._options = Array.from(this.querySelectorAll('.combo-option'));
    this._options.forEach(opt => this._optionsWrapper.appendChild(opt));
  }

  _initSelection() {
    const initial = this.getAttribute('data-combo-value');
    // Clear any existing selects
    this._options.forEach(o => o.classList.remove('selected'));

    if (!this.classList.contains('multiple')) {
      // Single: find by attribute or pre-selected class
      const sel = this._options.find(o => o.getAttribute('data-option-value') === initial)
          || this._options.find(o => o.classList.contains('selected'));
      if (sel) this._selectSingle(sel);
    } else {
      // Multiple: collect those already marked .selected
      this._options
      .filter(o => o.classList.contains('selected'))
      .forEach(o => {
        this._multiData.push({
          value: o.getAttribute('data-option-value'),
          text:  o.textContent.trim()
        });
      });
      this._updateMultiDisplay();
    }
  }

  _syncValue(newVal) {
    // Sync when data-combo-value changes from outside
    const isSingle = !this.classList.contains('multiple');
    if (isSingle) {
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

  // ——————————
  // Open / Close / Search
  // ——————————

  _toggleDropdown(e) {
    e.stopPropagation();
    const isOpen = this._dropdownEl.classList.toggle('opened');
    this._selectedEl.classList.toggle('active', isOpen);

    if (isOpen && this.hasAttribute('searchable')) {
      // Inject the search input once
      if (!this._searchInput) {
        this._searchInput = document.createElement('input');
        this._searchInput.type      = 'text';
        this._searchInput.className = 'combo-box-search';
        this._selectedEl.appendChild(this._searchInput);
        this._searchInput.focus();
      }
      // Reset any previous filtering
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
    // show all options again
    this._options.forEach(o => o.classList.remove('combo-option_hidden'));
    const msg = this._optionsWrapper.querySelector('.combo-box-message');
    if (msg) msg.remove();
  }

  // ——————————
  // Option Selection
  // ——————————

  _onOptionClick(e) {
    const opt = e.target.closest('.combo-option');
    if (!opt) return;

    if (this.classList.contains('multiple')) {
      // Toggle in multi-mode
      if (opt.classList.contains('selected')) {
        this._removeMultiOption(opt);
      } else {
        this._selectOption(opt);
        this._addMultiData(opt);
      }
      this._updateMultiDisplay();
    } else {
      // Single
      this._selectSingle(opt);
      this._closeDropdown();
    }
  }

  _selectSingle(opt) {
    const val = opt.getAttribute('data-option-value');
    this._options.forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected');
    this.setAttribute('data-combo-value', val);
    this.querySelector('.combo-box-selected-wrap').innerHTML = opt.innerHTML;
  }

  _selectOption(opt) {
    if (!this.classList.contains('multiple')) {
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
    opt.classList.remove('selected');
    const val = opt.getAttribute('data-option-value');
    this._multiData = this._multiData.filter(item => item.value !== val);
  }

  _updateMultiDisplay() {
    const wrap  = this.querySelector('.combo-box-selected-wrap');
    const texts = this._multiData.map(d => d.text);

    if (this.classList.contains('tag-mode')) {
      wrap.innerHTML = this._multiData
      .map(d => `<span class="combo-box-tag" data-tag-value="${d.value}">${d.text}</span>`)
      .join('');
    } else {
      wrap.textContent = texts.length > this._maxItemsShow
          ? `${texts.slice(0, this._maxItemsShow).join(', ')} +${texts.length - this._maxItemsShow}`
          : texts.join(', ');
    }
    this.setAttribute('data-combo-value', this._multiData.map(d => d.value).join(', '));
  }

  // ——————————
  // Original plugin’s filter logic
  // ——————————

  _handleSearchKeyUp(e) {
    // only act on keyups in the search input
    if (!e.target.classList.contains('combo-box-search')) return;
    this._filterOptionsWithQuery(e);
  }

  _filterOptionsWithQuery(e) {
    const valRaw = e.target.value;
    const val    = valRaw.trim();
    const up     = val.toUpperCase();
    console.log('filter option',val);
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
      // show all when input is empty
      this._options.forEach(option => {
        option.classList.remove('combo-option_hidden');
      });
    }

    // Show “nothing found” if none match
    const noneVisible = !this._options.some(opt => !opt.classList.contains('combo-option_hidden'));
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

// 3. Register
customElements.define('combo-box', ComboBox);
