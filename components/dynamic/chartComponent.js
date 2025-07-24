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
import "./select-box.js";
import "./modal-popup.js";

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

    // — Map period selection → start/end attrs —
    _periodToDates(period) {
        const now = new Date();
        let start, end;

        switch (period) {
            case "today":
                start = new Date(now);
                end = start;
                break;
            case "week":
                start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                end = new Date(now);
                break;
            case "custom":
                // Custom: assume consumer will set start-date/end-date manually.
                // If missing, default both to today.
                if (!this.getAttr("start-date") || !this.getAttr("end-date")) {
                    this._applyPeriodToDates("today");
                }
                return;
            default:
                return;
        }

        const fmt = (d) => d.toISOString().slice(0, 10);
        return {
            start: fmt(start),
            end: fmt(end),
        };
        // this.setAttribute('start-date', fmt(start));
        // this.setAttribute('end-date',   fmt(now));
    }

    onSelectChange(e) {
        let dateRangeObj = null;
        console.log("onSelectChange", e.target.value);
        if (e.target.value === "custom") {
            console.log("custom");
            this.selectedPeriod = "custom";
            this._openDateRangePopup();
        } else {
            dateRangeObj = this._periodToDates(e.target.value);
            this.selectedPeriod = e.target.value;
            this.setAttribute("start-date", dateRangeObj.start);
            this.setAttribute("end-date", dateRangeObj.end);
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

    _openDateRangePopup() {
        console.log("openDateRangePopup");
        //============
        const modal = document.createElement('modal-popup');
        document.body.appendChild(modal);

        modal.setContent(`
          <div class="modal__title">
            Ընտրեք ամսաթվի միջակայքը
          </div>
        
          <div class="modal__datepickers">
            <div class="datepicker">
              <label for="start" class="datepicker__label">սկիզբ</label>
              <input type="date" id="start" class="datepicker__input" />
            </div>
            <div class="datepicker">
              <label for="end" class="datepicker__label">ավարտ</label>
              <input type="date" id="end" class="datepicker__input" />
            </div>
          </div>
        
          <div class="modal__buttons">
            <button class="cancel btn btn_md btn_white"><span>Չեղարկել</span></button>
            <button class="ok btn btn_md btn_blue"><span>Կիրառել</span></button>
          </div>
        `);

        // Add button listeners
        const cancelBtn = modal.querySelector('.cancel');
        const okBtn = modal.querySelector('.ok');

        cancelBtn?.addEventListener('click', () => modal.remove());
        okBtn?.addEventListener('click', () => {
            const start = modal.querySelector('#start').value;
            const end   = modal.querySelector('#end').value;
            if (!start || !end) return;

            modal.remove();

            //    – Set ChartComponent attrs so fetchAndRenderChart sees them:
            this.setAttribute('start-date', start);
            this.setAttribute('end-date',   end);

            //    – Update the label in the select-box so user sees “YYYY-MM-DD – YYYY-MM-DD”
            this.selectBox
            .querySelector('.combo-box-selected-wrap').textContent = `${start} – ${end}`;

            // 5. Finally, re-fetch
            this.fetchAndRenderChart();
        });

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
      <select-box 
        value="${this.selectedPeriod}" 
        options='[ 
          {"value":"today","label":"Այսօր"}, 
          {"value":"week","label":"Այս շաբաթ"}, 
          {"value":"custom","label":"Ամսաթվի միջակայք"} 
          ]'
      >
      </select-box>
      
  
      ${chartHTML}
    `;
    }
}

// Register the component
customElements.define("chart-component", ChartComponent);
