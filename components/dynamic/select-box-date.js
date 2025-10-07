import { DynamicElement } from '../../core/dynamic-element.js';
import './select-box.js';
import {
  openDateRangePopup,
  resolvePeriodToDates,
} from '../../core/utils/date-utils.js';

class SelectBoxDate extends DynamicElement {
  constructor() {
    super();
    this.selectEl = null;
    this.startDate = null;
    this.endDate = null;
    this.period = 'today';
  }

  static get observedAttributes() {
    return ['start-date', 'end-date'];
  }

  onConnected() {
    this._updateFromAttributes();
    this.render();
  }

  onAttributeChange(name, oldValue, newValue) {
    if (name === 'start-date' || name === 'end-date') {
      this._updateFromAttributes();
      if (this.selectEl) {
        this.selectEl.value = this.period;
        if (this.period === 'custom') {
          this._setCustomLabel(this.startDate, this.endDate);
        }
      }
    }
  }

  onAfterRender() {
    this.selectEl = this.$('select-box');
    if (this.selectEl) {
      this.selectEl.value = this.period;
      if (this.period === 'custom') {
        this._setCustomLabel(this.startDate, this.endDate);
      }
    }
  }

  addEventListeners() {
    if (this.selectEl) {
      this.addListener(this.selectEl, 'change', this.onSelectChange);
      this.addListener(this.selectEl, 'click', this.onSelectClick);
    }
  }

  onSelectChange(e) {
    console.log('onSelectChange', e.target.value);
    
    const val = e.target.value;

    if (val === 'custom') {
      openDateRangePopup().then((range) => {
        if (range && range.startDate && range.endDate) {
          this.startDate = range.startDate;
          this.endDate = range.endDate;
          this.period = 'custom';
          this._setCustomLabel(this.startDate, this.endDate);
          this.dispatch('date-range-change', {
            startDate: this.startDate,
            endDate: this.endDate,
            period: 'custom',
          });
        }
      });
    } else {
      const range = resolvePeriodToDates(val);
      if (range) {
        this.startDate = range.startDate;
        this.endDate = range.endDate;
        this.period = val;

        this.dispatch('date-range-change', {
          startDate: this.startDate,
          endDate: this.endDate,
          period: val,
        });
      }
    }
  }

  onSelectClick(e) {
    console.log('onSelectClick', this.selectEl.value);
    //todo: ask Anna why this was here

    // if (this.selectEl.value === 'custom') {
    //   // force open custom date picker again
    //   this.onSelectChange({ target: { value: 'custom' } });
    // }
  }

  _updateFromAttributes() {
    this.startDate = this.getAttr('start-date') || null;
    this.endDate = this.getAttr('end-date') || null;
    this.period = this._datesToPeriod(this.startDate, this.endDate);
  }

  _datesToPeriod(start, end) {
    if (!start || !end) return 'today';
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekEndStr = weekEnd.toISOString().slice(0, 10);

    if (start === todayStr && end === todayStr) {
      return 'today';
    }
    if (start === todayStr && end === weekEndStr) {
      return 'week';
    }
    return 'custom';
  }

  _setCustomLabel(start, end) {
    if (!this.selectEl) return;
    const wrap = this.selectEl.querySelector('.combo-box-selected-wrap');
    if (wrap) wrap.textContent = `${start} – ${end}`;
    this.selectEl.value = 'custom';
  }

  template() {
    return /* html */ `
      <select-box
        value="${this.period}"
        options='[
          {"value":"today","label":"Այսօր"},
          {"value":"week","label":"Նախորդ 7 օր"},
          {"value":"custom","label":"Ամսաթվի միջակայք"}
        ]'>
      </select-box>
    `;
  }
}

export { SelectBoxDate };
customElements.define('select-box-date', SelectBoxDate);
