import { StaticElement } from '../../core/static-element.js';

class ChangeIndicator  extends StaticElement {
  render() {
    const color = this.getAttribute('direction')== 'up' ? 'stat_green' : 'stat_red';
    const direction = this.getAttribute('direction')== 'up' ? 'icon-up' : 'icon-down';
    return /*html*/`
    <div class="chart-info__stat stat ${color}"><i class="icon ${direction}"></i><span>+${this.getAttribute('value')}%</span></div>
    `;
  }
}

customElements.define('change-indicator', ChangeIndicator );