import { DynamicElement } from "../../core/dynamic-element.js";
import { createLineChart } from "../../core/utils/chart-utils.js";
// import "../ui/selectBox.js"
import "./select-box.js";


const observedAttrs = ['api-url', 'city', 'region', 'start-date', 'end-date'];
class ChartComponent extends DynamicElement {
  static get observedAttributes() {
    return observedAttrs;
  }

  onConnected() {
    this.canvasId = `canvas-${this.getAttr('id', 'line-chart')}`;
    this.legendId = `legend-${this.canvasId}`;
    this.hasConnected = true;
    this.fetchAndRenderChart();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue && this.hasConnected && observedAttrs.includes(name)) {
      this.fetchAndRenderChart();
    }
  }

  async fetchAndRenderChart() {
    const endpoint = this.getAttr('api-url');
    const startDate = this.getAttr('start-date');
    const endDate = this.getAttr('end-date');
    const city = this.getAttr('city');
    const region = this.getAttr('region');

    if (!endpoint) {
      console.warn('<chart-component> is missing required "api-url" attribute');
      return;
    }

    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (city) params.append('city', city);
    if (region) params.append('region', region);

    const url = `${endpoint}?${params.toString()}`;

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
      <combo-box data-combo-name="single" data-combo-value="today">
         <span slot="placeholder">Այսօր</span>
          <div class="combo-option selected" data-option-value="today">Այսօր</div>
          <div class="combo-option" data-option-value="1">Այս շաբաթ</div>
          <div class="combo-option" data-option-value="2">Այս ամիս</div>
      </combo-box>
  
      <div class="chart chart_252">
        <canvas id="${this.canvasId}"></canvas>
      </div>
      <div class="custom-legend custom-legend_checkmark" id="${this.legendId}"></div>
    `;
  }

  onAfterRender() {
    console.log('after render',this.state);
    if (this.state.chartData) {
      createLineChart(this.canvasId, this.state.chartData, this.legendId);
    }
  }
}

// Register the component
customElements.define('chart-component', ChartComponent);