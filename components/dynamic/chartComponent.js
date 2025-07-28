import { DynamicElement } from "../../core/dynamic-element.js";
import {
  createBarChart,
  updateBarChart,
  createDoughnutChart,
  updateDoughnutChart,
  createLineChart,
  updateLineChart,
} from "../../core/utils/chart-utils.js";
import chartDataTransformer from "../../core/utils/data-transformer.js";
// import "../ui/selectBox.js"
import "./select-box-date.js";
import "./modal-popup.js";
import { openDateRangePopup, resolvePeriodToDates } from "../../core/utils/date-utils.js";

const observedAttrs = ["api-url", "city", "region", "start-date", "end-date"];
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
    };

    this.selectBox = null;
    this.selectedPeriod = this._dateToPeriod();
    this.canvasId = `canvas-${this.getAttr("id", "line-chart")}`;
    this.legendId = `legend-${this.canvasId}`;

    this.chart = null;
    this.transformedData = null;
    this.chartType = this.getAttr("chart-type");
  }

  static get observedAttributes() {
    return observedAttrs;
  }

  onConnected() {
    this.hasConnected = true;
    this.fetchAndRenderChart();
  }

  onAfterRender() {
    this.selectBox = this.$("select-box");

    const chartData = this.transformedData ? this.transformedData.chartData : null;
    switch (this.chartType) {
      case "line":
        this.chart = createLineChart(this.canvasId, chartData, this.legendId);
        break;
      case "doughnut":
        this.chart = createDoughnutChart(this.canvasId, chartData, this.legendId);
        break;
      case "bar":
        this.chart = createBarChart(this.canvasId, chartData, this.legendId);
        break;
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
            this.addListener(this.selectBox, "change", this.onSelectChange);
        }
    }

    // — Map incoming start/end → period selection —
    _dateToPeriod() {
        // const sel = this.querySelector('select-box');
        let start = this.getAttr("start-date");
        let end = this.getAttr("end-date");

        let period;
        if (!end || !start) {
            return "today";
        }

        const s = new Date(start);
        const e = new Date(end);
        const diffDays = (e - s) / (1000 * 60 * 60 * 24);

        if (diffDays === 0) {
            period = "today";
        } else if (diffDays === 7) {
            period = "week";
        } else {
            period = "custom";
        }

        // Update the select-box UI
        // this.selectBox.value = period;
        return period;
    }


    onSelectChange(e) {
        const val = e.target.value;
        if (val === "custom") {
            this.selectedPeriod = "custom";
            openDateRangePopup().then(range => {
                if (!range) return;
                this.setAttribute("start-date", range.startDate);
                this.setAttribute("end-date", range.endDate);
                this.selectBox
                    .querySelector('.combo-box-selected-wrap').textContent = `${range.startDate} – ${range.endDate}`;
                this.fetchAndRenderChart();
            });
        } else {
            const dateRangeObj = resolvePeriodToDates(val);
            if (!dateRangeObj) return;
            this.selectedPeriod = val;
            this.setAttribute("start-date", dateRangeObj.startDate);
            this.setAttribute("end-date", dateRangeObj.endDate);
            this.fetchAndRenderChart();
        }
    }

    setState(newState) {
        return super.setState(newState);
    }

    async fetchAndRenderChart() {
        const endpoint = this.getAttr("api-url");
        if (!endpoint) {
            console.warn('<chart-component> is missing required "api-url" attribute');
            return;
        }

        if (this.chart !== null) {
            this.chart.options.showLoading = true;
            this.chart.update();
        }

        const startDate = this.getAttr("start-date") || null;
        const endDate = this.getAttr("end-date") || null;
        const city = this.getAttr("city") || null;
        const region = this.getAttr("region") || null;

        const params = new URLSearchParams();
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);
        if (city) params.append("city", city);
        if (region) params.append("region", region);

        const url = `${endpoint}?${params.toString()}`;
        try {
            const response = await this.fetchData(url);

            const isValid = response && response.errors === null && response.data;

            if (!isValid) throw new Error("Invalid API response format");

            // const chartData = this.transformData(response.data);
            switch (this.chartType) {
                case "line":
                    this.transformedData = chartDataTransformer.transformData(response.data);
                    this._updateChart();
                    break;
                case "doughnut":
                    this.transformedData = chartDataTransformer.transformDoughnutData(response.data);
                    this._updateChart();
                    break;
                case "bar":
                    this.transformedData = chartDataTransformer.transformBarData(response.data);
                    this._updateChart();
                    break;
            }
        } catch (err) {
            console.warn("Chart fetch error:", err);
            this.setState({ chartData: null, error: true });
        }
    }

  transformBarData(data) {
    const labels = [];
    const workingData = [];
    const nonWorkingData = [];

    for (const day of data.work_hours_per_day) {
      labels.push(day.date);
      workingData.push(day.working_percent);
      nonWorkingData.push(day.non_working_percent);
    }

    return {
      labels,
      datasets: [
        {
          label: "Աշխատաժամանակ",
          data: workingData,
        },
        {
          label: "Պարապուրդ",
          data: nonWorkingData,
        },
      ],
    };
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
                },
            ],
        };
    }


  _updateChart() {
    switch (this.chartType) {
      case "line":
        updateLineChart(this.chart, this.transformedData.chartData);
        break;
      case "doughnut":
        this.$(".chart-info__number").childNodes[0].textContent =
          this.transformedData.metaData.total;
        this.$("change-indicator").setAttribute("value", 15);
        updateDoughnutChart(this.chart, this.transformedData.chartData);
        break;
      case "bar":
        updateBarChart(this.chart, this.transformedData.chartData);
        break;
    }
  }

    template() {
        if (this.isLoading()) {
            return `<div>Loading chart…</div>`;
        }

        let chartHTML = "";
        switch (this.chartType) {
            case "doughnut":
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
        `;
                break;
            case "bar":
                chartHTML = `
        <div class="chart chart_228">
          <canvas id="${this.canvasId}"></canvas>
        </div>
        <div class="custom-legend custom-legend_checkmark" id="${this.legendId}"></div>
    `;
                break;
            case "line":
                chartHTML = `
          <div class="chart chart_252">
            <canvas id="${this.canvasId}"></canvas>
          </div>
          <div class="custom-legend custom-legend_checkmark" id="${this.legendId}"></div>
          `;
            default:
                break;
        }
        if (this.state.error) {
            return `<div class="error">Failed to load chart data.</div>`;
        }
        this.classList.add("chart-container");
        return `
      <select-box-date 
        value="${this.selectedPeriod}" 
        options='[ 
          {"value":"today","label":"Այսօր"}, 
          {"value":"week","label":"Այս շաբաթ"}, 
          {"value":"custom","label":"Ամսաթվի միջակայք"} 
          ]'
      >
      </select-box-date>
      
  
      ${chartHTML}
    `;
    }
}

// Register the component
customElements.define("chart-component", ChartComponent);
