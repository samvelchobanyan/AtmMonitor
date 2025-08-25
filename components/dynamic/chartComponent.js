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
import { memoryStore } from "../../core/memory-store.js";
import "./select-box-date.js";
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
        this.canvasId = `canvas-${this.getAttr("id", "line-chart")}`;
        this.legendId = `legend-${this.canvasId}`;
        // console.log(this.canvasId);

        this.chart = null;
        this.transformedData = null;
        this.chartType = this.getAttr("chart-type");
        this.memoryKey = `chart-${this.getAttr("id")}`;

        this.showDateSelector = this.hasAttribute("show-date-selector")
            ? this.getAttr("show-date-selector") !== "false"
            : true;
    }

    static get observedAttributes() {
        return observedAttrs;
    }

    static get nonRenderingAttributes() {
        return new Set(["start-date", "end-date"]);
    }

    onConnected() {
        this.hasConnected = true;
        const override = memoryStore.get(this.memoryKey);
        if (override) {
            if (override.startDate) this.setAttribute("start-date", override.startDate);
            if (override.endDate) this.setAttribute("end-date", override.endDate);
            this.fetchAndRenderChart();
        } else {
            const dataAttr = this.getAttr("chart-data");
            if (dataAttr) {
                try {
                    const parsed = JSON.parse(dataAttr);
                    switch (this.chartType) {
                        case "line":
                            this.transformedData = chartDataTransformer.transformData(parsed);
                            break;
                        case "doughnut":
                            this.transformedData = chartDataTransformer.transformDoughnutData(
                                parsed
                            );
                            break;
                        case "bar":
                            this.transformedData = chartDataTransformer.transformBarData(parsed);
                            break;
                    }
                } catch (err) {
                    console.warn("Invalid chart-data attribute", err);
                    this.fetchAndRenderChart();
                    return;
                }
            } else {
                this.fetchAndRenderChart();
            }
        }
    }

    onAfterRender() {
        this.selectBox = this.$("select-box-date");

        const chartData = this.transformedData ? this.transformedData.chartData : null;
        switch (this.chartType) {
            case "line":
                this.chart = createLineChart(this.canvasId, chartData, this.legendId);
                break;
            case "doughnut":
                this.chart = createDoughnutChart(this.canvasId, chartData, this.legendId);
                break;
            case "bar":
                const stacked = this.hasAttribute("stacked")
                    ? this.getAttr("stacked") !== "false"
                    : false;

                this.chart = createBarChart(this.canvasId, chartData, this.legendId, stacked);
                break;
        }

        // if (this.state.chartData && !this.state.isLoading) {
        //   console.log('state after render',this.state);
        //   createLineChart(this.canvasId, this.state.chartData, this.legendId);
        // }
    }

    addEventListeners() {
        if (this.selectBox) {
            this.addListener(this.selectBox, "date-range-change", this.onDateRangeChange);
        }
    }

    onDateRangeChange(e) {
        const { startDate, endDate, period } = e.detail || {};
        if (!startDate || !endDate) return;

        memoryStore.set(this.memoryKey, { startDate, endDate });
        this.setAttribute("start-date", startDate);
        this.setAttribute("end-date", endDate);
        this.fetchAndRenderChart();
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
            // console.log("response", response);

            const isValid = response && response.errors === null && response.data;

            if (!isValid) throw new Error("Invalid API response format");
            const data_array_name = startDate === endDate ? "hourly_data" : "daily_data";

            // const chartData = this.transformData(response.data);
            switch (this.chartType) {
                case "line":
                    this.transformedData = chartDataTransformer.transformData(
                        response.data[data_array_name]
                    );
                    this._updateChart();
                    break;
                case "doughnut":
                    this.transformedData = chartDataTransformer.transformDoughnutData(
                        response.data
                    );
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

    _updateChart() {
        switch (this.chartType) {
            case "line":
                updateLineChart(this.chart, this.transformedData.chartData);
                break;
            case "doughnut":
                this.$(
                    ".chart-info__number"
                ).childNodes[0].textContent = this.transformedData.metaData.total.toLocaleString();
                this.$("change-indicator").setAttribute(
                    "value",
                    this.transformedData.metaData.percent
                );
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
                const dataAttr = this.getAttr("chart-data");
                const parsed = JSON.parse(dataAttr);
                this.transformedData = chartDataTransformer.transformDoughnutData(parsed);

                chartHTML = `
                  <div class="chart-container chart-container_between">
                      <div class="chart chart_280">
                          <canvas id="${this.canvasId}"></canvas>
                          <div class="chart-info">
                              <div class="chart-info__number">${this.transformedData.metaData.total.toLocaleString()}<span>֏</span></div>
                              <change-indicator value="${
                                  this.transformedData.metaData.percent
                              }"></change-indicator>
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
        <div class="custom-legend custom-legend_wrap custom-legend_checkmark" id="${this.legendId}"></div>
    `;
                break;
            case "line":
                chartHTML = `
                  <div class="chart chart_252">
                    <canvas id="${this.canvasId}"></canvas>
                  </div>
                  <div class="custom-legend custom-legend_wrap custom-legend_checkmark" id="${this.legendId}"></div>
                  `;
            default:
                break;
        }
        if (this.state.error) {
            return `<div class="error">Failed to load chart data.</div>`;
        }
        this.classList.add("chart-container");
        const dateSelectorHTML = this.showDateSelector
            ? `
      <select-box-date
        start-date="${this.getAttr("start-date")}"
        end-date="${this.getAttr("end-date")}"
      ></select-box-date>`
            : "";

        return `
      ${dateSelectorHTML}
      ${chartHTML}
    `;
    }
}

// Register the component
customElements.define("chart-component", ChartComponent);
