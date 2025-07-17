// components/ui/change-indicator.js
import { BaseElement } from '../../core/base-element.js';

class ChangeIndicator extends BaseElement {
  static get properties() {
    return ['value'];
  }

  render() {
    // 1) grab the raw text (e.g. "17" or "-15.22")
    const value = this.getAttribute('value') ?? '0';

    // 2) numeric test for color/icon
    const isPositive = Number(value) >= 0;
    const colorClass = isPositive ? 'stat_green' : 'stat_red';
    const iconClass  = isPositive ? 'icon-up'   : 'icon-down';

    // 3) output raw text exactly as-is (we append '%' here—you can drop it if you
    //    prefer the consumer to include the percent sign in the attribute)
    this.innerHTML = /*html*/`
      <div class="chart-info__stat stat ${colorClass}">
        <i class="icon ${iconClass}"></i>
        <span>${value}%</span>
      </div>
    `;
  }
}

customElements.define('change-indicator', ChangeIndicator);
