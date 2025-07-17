import { DynamicElement } from "../../core/dynamic-element.js";
import {
  createDoughnutChart,
  createLineChart,
  updateDoughnutChart,
  updateLineChart,
} from '../../core/utils/chart-utils.js';
import chartDataTransformer from '../../core/utils/data-transformer.js';
// import "../ui/selectBox.js"
import "./select-box.js";



const observedAttrs = ['api-url', 'city', 'region', 'start-date', 'end-date'];
class ChartComponent extends DynamicElement {
  constructor() {
    super();
    this.renderCount = 0;

    this.state = {
      ...this.state,
      chartData: null,
      // endpoint: this.getAttr('api-url') || null,
      // startDate: this.getAttr('start-date') || null,
      // endDate: this.getAttr('end-date') || null,
      // city: this.getAttr('city') || null,
      // region: this.getAttr('region') || null,
    }

    this.selectBox = null;
    this.selectedPeriod = this._dateToPeriod();
    this.canvasId = `canvas-${this.getAttr('id', 'line-chart')}`;
    this.legendId = `legend-${this.canvasId}`;

    this.chart = null;
    this.transformedData = null;
    this.chartType = this.getAttr('chart-type')
  }


  static get observedAttributes() {
    return observedAttrs;
  }

  onConnected() {
    console.log('connected');
    this.hasConnected = true;
    this.fetchAndRenderChart();
  }

  onAfterRender() {
    this.selectBox = this.$('select-box');
    const chartData = this.transformedData ? this.transformedData.chartData : null;
    console.log('after render', this.transformedData, chartData)
    switch (this.chartType) {
      case 'line':
        this.chart = createLineChart(this.canvasId, chartData, this.legendId);
        break
      case 'doughnut':
        this.chart = createDoughnutChart(this.canvasId, chartData, this.legendId);
        break
    }


    // if (this.state.chartData && !this.state.isLoading) {
    //   console.log('state after render',this.state);
    //   createLineChart(this.canvasId, this.state.chartData, this.legendId);
    // }
  }

  addEventListeners() {
    // Override in child classes to set up template-based event listeners
    // Called after every render for elements inside the component's innerHTML
    // Example:
    if (this.selectBox) {
      this.addListener(this.selectBox, 'change', this.onSelectChange);
    }

  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue && this.hasConnected && observedAttrs.includes(name)) {
      // console.log('attribute changed', name);
    }
  }

  // — Map incoming start/end → period selection —
  _dateToPeriod() {
    // const sel = this.querySelector('select-box');
    let start = this.getAttr('start-date');
    let end   = this.getAttr('end-date');

    let period;
    if(!end || !start){
      return 'today'
    }


    const s = new Date(start);
    const e = new Date(end);
    const diffDays = (e - s) / (1000*60*60*24);

    if (diffDays === 0) {
      period = 'today';
    } else if (diffDays === 7) {
      period = 'week';
    } else {
      period = 'custom';
    }

    // Update the select-box UI
    // this.selectBox.value = period;
    return period
  }

  // — Map period selection → start/end attrs —
  _periodToDates(period) {
    const now = new Date();
    let start,end;

    switch (period) {
      case 'today':
        start = new Date(now);
        end = start;
        break;
      case 'week':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        end = new Date(now);
        break;
      case 'custom':
        // Custom: assume consumer will set start-date/end-date manually.
        // If missing, default both to today.
        if (!this.getAttr('start-date') || !this.getAttr('end-date')) {
          this._applyPeriodToDates('today');
        }
        return;
      default:
        return;
    }

    const fmt = d => d.toISOString().slice(0, 10);
    return {
      start:fmt(start),
      end:fmt(end)
    }
    // this.setAttribute('start-date', fmt(start));
    // this.setAttribute('end-date',   fmt(now));
  }

  onSelectChange(e){
    console.log('select change - listener ID:', e.target.value);
    let dateRangeObj = null;

    if (e.target.value === 'custom') {
      console.log('open popup');
      this.selectedPeriod = 'custom';
      this._openDateRangePopup();
    }else{
      dateRangeObj = this._periodToDates(e.target.value);
      this.selectedPeriod = e.target.value;
      this.setAttribute('start-date',dateRangeObj.start)
      this.setAttribute('end-date',dateRangeObj.end)
      this.fetchAndRenderChart();
      console.log('dateRangeObj',dateRangeObj);
    }
  }

  setState(newState) {
    console.log('child set state', newState);
    return super.setState(newState);
  }

  async fetchAndRenderChart() {
    const endpoint = this.getAttr('api-url');
    if (!endpoint) {
      console.warn('<chart-component> is missing required "api-url" attribute');
      return;
    }

    if(this.chart !== null){
      console.log('set loading true before fetch');
      this.chart.options.showLoading = true;
      this.chart.update();
    }

    const startDate = this.getAttr('start-date');
    const endDate = this.getAttr('end-date');
    const city = this.getAttr('city');
    const region = this.getAttr('region');

    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (city) params.append('city', city);
    if (region) params.append('region', region);

    console.log('fetching');

    const url = `${endpoint}?${params.toString()}`;
    try {
      const response = await this.fetchData(url);

      const isValid =
          response &&
          response.errors === null &&
          response.data &&
          Array.isArray(response.data.daily_data);

      if (!isValid) throw new Error('Invalid API response format');

      // const chartData = this.transformData(response.data);
      switch (this.chartType){
        case 'line':
          this.transformedData = chartDataTransformer.transformData(response.data)
          this._updateChart();
          break;
        case 'doughnut':
            this.transformedData = chartDataTransformer.transformDoughnutData(response.data)
            this._updateChart();
            break;
      }
    } catch (err) {
      console.warn('Chart fetch error:', err);
      this.setState({ chartData: null, error: true });
    }
  }

  transformData(data) {
    const labels = [];
    const depositData = [];
    const dispenseData = [];

    for (const day of data.daily_data) {
      labels.push(day.date);
      depositData.push(day.deposit_total);
      dispenseData.push(day.dispense_total);
    }

    return {
      labels,
      datasets: [
        {
          label: "Կանխիկացված գումար",
          data: dispenseData,
        },
        {
          label: "Մուտքագրված գումար",
          data: depositData,
        }
      ]
    };
  }

  _openDateRangePopup() {
    // 1. Build a simple modal
    const modal = document.createElement('div');
    modal.className = 'date-modal';
    modal.innerHTML = `
      <div class="date-modal-content">
      <h2>Ընտրեք ամսաթվի միջակայքը</h2>
      <hr/>
  
      <div class="date-inputs">
        <label>
          Սկիզբ
          <input type="date" id="startDate" />
        </label>
        <span class="arrow">→</span>
        <label>
          Ավարտ
          <input type="date" id="endDate" />
        </label>
      </div>
  
      <div class="modal-footer">
        <button id="cancelBtn" class="btn btn-cancel">Չեղարկել</button>
        <button id="okBtn" class="btn btn-ok">Կիրառել</button>
      </div>
    </div>
  `;
    console.log('opening modal');
    document.body.appendChild(modal);
    console.log('opening modal append');
    // 2. Wire up OK/Cancel
    modal.querySelector('#cancelBtn').addEventListener('click', () => modal.remove());

    modal.querySelector('#okBtn').addEventListener('click', () => {
      const start = modal.querySelector('#startDate').value;
      const end   = modal.querySelector('#endDate').value;
      if (!start || !end) return;

      // 3. Close modal
      modal.remove();

      // 4. Reflect back into your component:
      //    – Set ChartComponent attrs so fetchAndRenderChart sees them:
      this.setAttribute('start-date', start);
      this.setAttribute('end-date',   end);

      //    – Update the label in the select-box so user sees “YYYY-MM-DD – YYYY-MM-DD”
      this.selectBox
      .querySelector('.combo-box-selected-wrap')
          .textContent = `${start} – ${end}`;

      // 5. Finally, re-fetch
      this.fetchAndRenderChart();
    });
  }

  _updateChart(){
    switch (this.chartType) {
      case 'line':
        updateLineChart(this.chart,this.transformedData.chartData);
        break;
      case 'doughnut':
        this.$('.chart-info__number').childNodes[0].textContent = this.transformedData.metaData.total;
        this.$('change-indicator').setAttribute('value',15)
        updateDoughnutChart(this.chart,this.transformedData.chartData);
        break;
    }

  }

  template() {
    if (this.isLoading()) {
      return `<div>Loading chart…</div>`;
    }

    let chartHTML = '';
    switch (this.chartType) {
      case 'doughnut':
        chartHTML = `
          <div class="chart-container chart-container_between">
              <div class="chart chart_280">
                  <canvas id="${this.canvasId}"></canvas>
                  <div class="chart-info">
                      <div class="chart-info__number">15,000,000<span>֏</span></div>
                      <change-indicator value="7"></change-indicator>
                  </div>
              </div>
              <div class="custom-legend custom-legend_center" id="${this.legendId}"></div>
          </div>
        `
        break;
      case 'bar':
        break;
      case 'line':
        chartHTML = `
          <div class="chart chart_252">
            <canvas id="${this.canvasId}"></canvas>
          </div>
          <div class="custom-legend custom-legend_checkmark" id="${this.legendId}"></div>
          `
      default:
        break;

    }
    if (this.state.error) {
      return `<div class="error">Failed to load chart data.</div>`;
    }
    console.log('preparing template', chartHTML);
    this.classList.add("chart-container");
    return `
<!--      <select-box value="1" options='[ {"value":"1","label":"Այսօր"}, {"value":"2","label":"Այս շաբաթ"}, {"value":"3","label":"Այս ամիս"} ]'></select-box>-->
      <select-box name="single" value="${this.selectedPeriod}" searchable>
        <div class="combo-option selected" data-option-value="today">Այսօր</div>
        <div class="combo-option" data-option-value="week">Այս շաբաթ</div>
        <div class="combo-option" data-option-value="custom">Ամսաթվի միջակայք</div>
      </select-box>
  
      ${chartHTML}
    `;
  }

}

// Register the component
customElements.define('chart-component', ChartComponent);