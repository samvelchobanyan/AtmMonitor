/* selectBoxAttr.js - select box Web Component using options JSON attribute */

const template = document.createElement('template');
template.innerHTML = `
  <div class="combo-box-selected" role="button" aria-haspopup="listbox">
    <div class="combo-box-selected-wrap"></div>
  </div>
  <div class="combo-box-dropdown" role="listbox">
    <div class="combo-box-options"></div>
  </div>
`;

export default class SelectBoxAttr extends HTMLElement {
  static get observedAttributes() {
    return [
      'name',
      'options',
      'value',
      'data-max-items',
      'data-empty-message',
      'multiple',
      'searchable',
      'tag-mode',
      'class'
    ];
  }

  constructor() {
    super();
    this.classList.add('combo-box');
    this.appendChild(template.content.cloneNode(true));

    this._selectedEl     = this.querySelector('.combo-box-selected');
    this._dropdownEl     = this.querySelector('.combo-box-dropdown');
    this._optionsWrapper = this.querySelector('.combo-box-options');

    this._optionsData  = [];
    this._options      = [];
    this._searchInput  = null;
    this._multiData    = [];
    this._emptyMessage = this.getAttribute('data-empty-message') || 'Nothing found';
    this._maxItemsShow = Number(this.getAttribute('data-max-items')) || 3;
    this._currentTabIndex = -1;

    this._onDocumentClick   = this._onDocumentClick.bind(this);
    this._onOptionClick     = this._onOptionClick.bind(this);
    this._toggleDropdown    = this._toggleDropdown.bind(this);
    this._handleSearchKeyUp = this._handleSearchKeyUp.bind(this);
    this._handleKeyDown     = this._handleKeyDown.bind(this);
  }

  connectedCallback() {
    ['multiple','searchable','tag-mode'].forEach(attr =>
      this.classList.toggle(attr, this.hasAttribute(attr))
    );

    this._parseOptions();
    this._buildOptions();
    this._initSelection();

    this._selectedEl.addEventListener('click', this._toggleDropdown);
    this.addEventListener('click', this._onOptionClick);
    document.addEventListener('click', this._onDocumentClick);
    this.addEventListener('keyup', this._handleSearchKeyUp);
    this.addEventListener('keydown', this._handleKeyDown);

    this.setAttribute('tabindex','0');
  }

  disconnectedCallback() {
    this._selectedEl.removeEventListener('click', this._toggleDropdown);
    this.removeEventListener('click', this._onOptionClick);
    document.removeEventListener('click', this._onDocumentClick);
    this.removeEventListener('keyup', this._handleSearchKeyUp);
    this.removeEventListener('keydown', this._handleKeyDown);
  }

  attributeChangedCallback(attr, oldVal, newVal) {
    if (oldVal === newVal) return;
    switch (attr) {
      case 'options':
        this._parseOptions();
        this._buildOptions();
        this._initSelection();
        break;
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
    }
  }

  _parseOptions() {
    const raw = this.getAttribute('options') || '[]';
    try {
      const parsed = JSON.parse(raw);
      this._optionsData = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('Invalid JSON for <select-box-attr> options:', e);
      this._optionsData = [];
    }
  }

  _buildOptions() {
    this._optionsWrapper.innerHTML = '';
    this._options = this._optionsData.map(optData => {
      const optEl = document.createElement('div');
      optEl.className = 'combo-option';
      optEl.setAttribute('data-option-value', optData.value);
      if (optData.selected) optEl.classList.add('selected');
      optEl.textContent = optData.label;
      this._optionsWrapper.appendChild(optEl);
      return optEl;
    });
  }

  _initSelection() {
    const initial = this.getAttribute('value');
    this._options.forEach(o => o.classList.remove('selected'));

    if (!this.hasAttribute('multiple')) {
      const sel = this._options.find(o => o.getAttribute('data-option-value') === initial)
          || this._options.find(o => o.classList.contains('selected'));
      if (sel) this._selectSingle(sel);
    } else {
      this._multiData = [];
      this._options.filter(o => o.classList.contains('selected'))
        .forEach(o => {
          this._multiData.push({
            value: o.getAttribute('data-option-value'),
            text: o.textContent.trim()
          });
        });
      this._updateMultiDisplay();
    }
  }

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
      const vals = (newVal || '').split(',').map(v => v.trim());
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

  _toggleDropdown(e) {
    e.stopPropagation();
    this._currentTabIndex = -1;
    const isOpen = this._dropdownEl.classList.toggle('opened');
    this._selectedEl.classList.toggle('active', isOpen);
    if (isOpen) {
      this.focus();
    }

    if (isOpen && this.hasAttribute('searchable')) {
      if (!this._searchInput) {
        this._searchInput = document.createElement('input');
        this._searchInput.type = 'text';
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
    this._currentTabIndex = -1;
    if (this._searchInput) {
      this._searchInput.remove();
      this._searchInput = null;
    }
    this._options.forEach(o => {
      o.classList.remove('combo-option_hidden');
      o.classList.remove('combo-option_focused');
    });
    const msg = this._optionsWrapper.querySelector('.combo-box-message');
    if (msg) msg.remove();
  }

  _onOptionClick(e) {
    if (e.target.closest('.combo-box-tag__remove')) {
      const tag = e.target.closest('.combo-box-tag');
      const value = tag.getAttribute('data-tag-value');
      const opt = this._options.find(o => o.getAttribute('data-option-value') === value);
      if (opt) this._removeMultiOption(opt);
      this._updateMultiDisplay();
      return;
    }

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
      if (this._searchInput) {
        this._resetSearchInput();
      }
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
    this.setAttribute('value', val);
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
      text: opt.textContent.trim()
    });
  }

  _removeMultiOption(opt) {
    const val = opt.getAttribute('data-option-value');
    opt.classList.remove('selected');
    this._multiData = this._multiData.filter(item => item.value !== val);
  }

  _updateMultiDisplay() {
    const wrap = this.querySelector('.combo-box-selected-wrap');
    const texts = this._multiData.map(d => d.text);

    if (this.hasAttribute('tag-mode')) {
      wrap.innerHTML = `<div class="combo-box-tags">` +
        this._multiData
          .map(d => `<div class="combo-box-tag" data-tag-value="${d.value}"><div class="combo-box-tag__value">${d.text}</div><div class="combo-box-tag__remove">×</div></div>`)
          .join('') +
        `</div>`;
    } else {
      wrap.textContent = texts.length > this._maxItemsShow
        ? `${texts.slice(0, this._maxItemsShow).join(', ')} +${texts.length - this._maxItemsShow}`
        : texts.join(', ');
    }

    this.setAttribute('value', this._multiData.map(d => d.value).join(','));
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }

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
        msg.className = 'combo-box-message';
        msg.textContent = this._emptyMessage;
        this._optionsWrapper.appendChild(msg);
      }
    } else if (msg) {
      msg.remove();
    }
  }

  _getVisibleOptions() {
    return this._options.filter(o => !o.classList.contains('combo-option_hidden'));
  }

  _scrollToFocusedOption(current) {
    if (!current) return;
    const wrap = this._optionsWrapper;
    const view = wrap.offsetHeight - parseFloat(getComputedStyle(wrap).paddingTop);
    const top = current.offsetTop;

    if (top >= wrap.scrollTop + view) {
      wrap.scrollTop = wrap.scrollTop + current.offsetHeight;
    } else if (top < wrap.scrollTop) {
      wrap.scrollTop = top;
    }
  }

  _decreaseTabIndex() {
    if (this._currentTabIndex > 0) {
      this._currentTabIndex--;
    }
    const option = this._getVisibleOptions()[this._currentTabIndex];
    this._scrollToFocusedOption(option);
    this._moveFocus();
  }

  _increaseTabIndex() {
    const visible = this._getVisibleOptions();
    if (this._currentTabIndex < visible.length - 1) {
      this._currentTabIndex++;
    }
    this._scrollToFocusedOption(visible[this._currentTabIndex]);
    this._moveFocus();
  }

  _moveFocus() {
    const visible = this._getVisibleOptions();
    if (!visible.length) {
      if (!this._optionsWrapper.querySelector('.combo-box-message')) {
        const msg = document.createElement('div');
        msg.className = 'combo-box-message';
        msg.textContent = this._emptyMessage;
        this._optionsWrapper.appendChild(msg);
      }
      return;
    }
    const msg = this._optionsWrapper.querySelector('.combo-box-message');
    if (msg) msg.remove();

    this._options.forEach(o => o.classList.remove('combo-option_focused'));
    if (this._currentTabIndex !== -1 && visible[this._currentTabIndex]) {
      visible[this._currentTabIndex].classList.add('combo-option_focused');
    } else if (visible.length === 1) {
      visible[0].classList.add('combo-option_focused');
    }
  }

  _resetSearchInput() {
    if (this._searchInput) {
      this._searchInput.value = '';
    }
    this._options.forEach(o => o.classList.remove('combo-option_hidden'));
  }

  _addUserOption() {
    if (!this._searchInput) return;
    const value = this._searchInput.value.trim();
    if (!value) return;
    if (this._options.some(o => o.textContent.trim() === value)) return;

    const optEl = document.createElement('div');
    optEl.className = 'combo-option user-added-option';
    optEl.setAttribute('data-option-value', value);
    optEl.textContent = value;
    this._optionsWrapper.appendChild(optEl);
    this._options.push(optEl);

    if (this.hasAttribute('multiple')) {
      this._selectOption(optEl);
      this._addMultiData(optEl);
      this._updateMultiDisplay();
    } else {
      this._selectSingle(optEl);
    }
  }

  _handleKeyDown(e) {
    const key = e.keyCode || e.which;
    const arrow = { tab: 9, enter: 13, up: 38, down: 40, esc: 27, backspace: 8 };
    const isOpen = this._dropdownEl.classList.contains('opened');

    if (key === arrow.up && isOpen) {
      e.preventDefault();
      this._decreaseTabIndex();
    } else if (key === arrow.down && isOpen) {
      e.preventDefault();
      this._increaseTabIndex();
    } else if (key === arrow.enter && isOpen) {
      e.preventDefault();
      const focused = this._optionsWrapper.querySelector('.combo-option_focused');
      if (focused) {
        focused.click();
      } else if (this.classList.contains('allow-custom-options')) {
        this._addUserOption();
      }
      this._resetSearchInput();
    } else if (key === arrow.esc && isOpen) {
      e.preventDefault();
      this._closeDropdown();
    } else if (key === arrow.backspace && isOpen && this.hasAttribute('multiple')) {
      if (this._searchInput && this._searchInput.value === '' && this._multiData.length) {
        const last = this._multiData[this._multiData.length - 1];
        const opt = this._options.find(o => o.getAttribute('data-option-value') === last.value);
        if (opt) this._removeMultiOption(opt);
        this._updateMultiDisplay();
      }
    }
  }
}

customElements.define('select-box-attr', SelectBoxAttr);
