import { DynamicElement } from "../../core/dynamic-element.js";
import { createLineChart } from "../../core/utils/chart-utils.js";
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
      endpoint: this.getAttr('api-url') || null,
      startDate: this.getAttr('start-date') || null,
      endDate: this.getAttr('end-date') || null,
      city: this.getAttr('city') || null,
      region: this.getAttr('region') || null,
    }

    this.selectBox = null;
    this.canvasId = `canvas-${this.getAttr('id', 'line-chart')}`;
    this.legendId = `legend-${this.canvasId}`;
  }


  static get observedAttributes() {
    return observedAttrs;
  }

  onConnected() {
    this.hasConnected = true;
    this.fetchAndRenderChart();
  }

  onAfterRender() {
    this.selectBox = this.$('select-box');
    // this._dateToPeriod();

    if (this.state.chartData) {
      createLineChart(this.canvasId, this.state.chartData, this.legendId);
    }
  }

  addEventListeners() {
    // Override in child classes to set up template-based event listeners
    // Called after every render for elements inside the component's innerHTML
    // Example:
    console.log('addEventListeners called - render count:', ++this.renderCount || 1);
    console.log('event handler', this.selectBox);

    if (this.selectBox) {
      this.addListener(this.selectBox, 'change', (e) => {
        console.log('select change - listener ID:', Date.now());
      });

      console.log('event change event added to', this.selectBox);
    }

  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue && this.hasConnected && observedAttrs.includes(name)) {
      this.fetchAndRenderChart();
    }
  }

  // — Map incoming start/end → period selection —
  _dateToPeriod() {
    const sel = this.querySelector('select-box');
    let start = this.getAttr('start-date');
    let end   = this.getAttr('end-date');

    // Default both to today if neither provided
    if (!start && !end) {
      this._applyPeriodToDates('today');
      return;
    }
    // If only start provided, mirror to end
    if (start && !end) {
      this.setAttribute('end-date', start);
      end = start;
    }

    const s = new Date(start);
    const e = new Date(end);
    const diffDays = (e - s) / (1000*60*60*24);

    let period;
    if (diffDays === 0) {
      period = 'today';
    } else if (diffDays === 7) {
      period = 'oneWeek';
    } else {
      period = 'custom';
    }

    // Update the select-box UI
    this.selectBox.value = period;
  }

  // — Map period selection → start/end attrs —
  _applyPeriodToDates(period) {
    const now = new Date();
    let start;

    switch (period) {
      case 'today':
        start = new Date(now);
        break;
      case 'oneWeek':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
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
    this.setAttribute('start-date', fmt(start));
    this.setAttribute('end-date',   fmt(now));
  }

  async fetchAndRenderChart() {
    if (!this.state.endpoint) {
      console.warn('<chart-component> is missing required "api-url" attribute');
      return;
    }

    const params = new URLSearchParams();
    if (this.state.startDate) params.append('startDate', this.state.startDate);
    if (this.state.endDate) params.append('endDate', this.state.endDate);
    if (this.state.city) params.append('city', this.state.city);
    if (this.state.region) params.append('region', this.state.region);

    const url = `${this.state.endpoint}?${params.toString()}`;
    try {
      const response = await this.fetchData(url);

      const isValid =
          response &&
          response.errors === null &&
          response.data &&
          Array.isArray(response.data.daily_data);

      if (!isValid) throw new Error('Invalid API response format');

      const chartData = this.transformData(response.data);
      this.setState({ chartData, error: false });
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

  template() {
    if (this.isLoading()) {
      return `<div>Loading chart…</div>`;
    }

    if (this.state.error) {
      return `<div class="error">Failed to load chart data.</div>`;
    }

    this.classList.add("chart-container");
    return `
<!--      <select-box value="1" options='[ {"value":"1","label":"Այսօր"}, {"value":"2","label":"Այս շաբաթ"}, {"value":"3","label":"Այս ամիս"} ]'></select-box>-->
      <select-box name="single" value="today" searchable>
        <div class="combo-option selected" data-option-value="today">Այսօր</div>
        <div class="combo-option" data-option-value="week">Այս շաբաթ</div>
        <div class="combo-option" data-option-value="custom">Ամսաթվի միջակայք</div>
      </select-box>
  
      <div class="chart chart_252">
        <canvas id="${this.canvasId}"></canvas>
      </div>
      <div class="custom-legend custom-legend_checkmark" id="${this.legendId}"></div>
    `;
  }

  // Override setState to see what's triggering renders
  setState(newState) {
    console.log('setState called with:', newState);
    console.trace('setState called from:');
    super.setState(newState);
  }

// Override scheduleRender to see when renders are scheduled
  scheduleRender() {
    console.log('scheduleRender called');
    console.trace('scheduleRender called from:');
    super.scheduleRender();
  }

}

// Register the component
customElements.define('chart-component', ChartComponent);