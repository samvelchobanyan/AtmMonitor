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
import "../ui/customCheck.js";

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
                            this.transformedData = chartDataTransformer.transformData(
                                parsed,
                                this.getAttr("id")
                            );
                            break;
                        case "doughnut":
                            this.transformedData = chartDataTransformer.transformDoughnutData(
                                parsed
                            );

                            break;
                        case "bar":
                            const isGrouped = this.getAttribute("grouped");
                            if (isGrouped != null) {
                                this.transformedData = chartDataTransformer.transformBarData(
                                    parsed
                                );
                            } else {
                                this.transformedData = chartDataTransformer.transformStackBarData(
                                    parsed
                                );
                            }
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
                const isGrouped = this.hasAttribute("grouped")
                    ? this.getAttr("grouped") !== "false"
                    : false;

                this.chart = createBarChart(
                    this.canvasId,
                    chartData,
                    this.legendId,
                    isGrouped,
                    ({
                        label,
                        value,
                        dataset,
                        datasetIndex,
                        dataIndex,
                        columnLabel,
                        datasetLabel,
                    }) => {
                        // click on chart in atm details
                        this.dispatchEvent(
                            new CustomEvent("chart-bar-clicked", {
                                detail: { columnLabel },
                                bubbles: true,
                            })
                        );
                    }
                );
                break;
        }
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
        const atmId = this.getAttr("atm-id") || null;

        const params = new URLSearchParams();
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);
        if (city) params.append("city", city);
        if (region) params.append("province", region);
        if (atmId) params.append("atmId", atmId);

        // handle cases where endpoint has already param in there (for example atmId)
        let url = endpoint;
        if (url.includes("?")) {
            url += `&${params.toString()}`;
        } else {
            url += `?${params.toString()}`;
        }

        try {
            const response = await this.fetchData(url);

            // for dashboard incashment info cards
            this.dispatchEvent(
                new CustomEvent("chart-changed", {
                    detail: { data: response.data },
                    bubbles: true,
                })
            );

            const isValid = response && response.errors === null && response.data;

            if (!isValid) throw new Error("Invalid API response format");

            switch (this.chartType) {
                case "line":
                    const data_array_name = startDate === endDate ? "hourly_data" : "daily_data";

                    if (
                        this.getAttribute("id") == "line-chart-transaction-dynamics1" ||
                        this.getAttribute("id") == "line-chart-transaction-dynamics2" ||
                        this.getAttribute("id") == "line-chart-transactions"
                    ) {
                        // case for geo page
                        this.transformedData = chartDataTransformer.transformData(
                            response.data.overall_dynamic[data_array_name]
                        );
                    } else {
                        this.transformedData = chartDataTransformer.transformData(
                            response.data[data_array_name],
                            this.getAttr("id")
                        );
                    }
                    this.setState({ error: null });

                    this._updateChart();
                    break;
                case "doughnut":
                    this.transformedData = chartDataTransformer.transformDoughnutData(
                        response.data
                    );
                    // this.setState({ error: null });

                    // this.setState({ error: null });

                    this._updateChart();
                    break;
                case "bar":
                    const isGrouped = this.hasAttribute("grouped")
                        ? this.getAttr("grouped") !== "false"
                        : false;

                    if (isGrouped != null) {
                        this.transformedData = chartDataTransformer.transformBarData(response.data);
                    } else {
                        this.transformedData = chartDataTransformer.transformStackBarData(
                            response.data
                        );
                    }

                    this.setState({ error: null });

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
                ).textContent = this.transformedData.metaData.total.toLocaleString();
                this.$("change-indicator").setAttribute(
                    "value",
                    this.transformedData.metaData.percent
                );
                updateDoughnutChart(this.chart, this.transformedData.chartData);
                break;
            case "bar":
                const isGrouped = this.hasAttribute("grouped")
                    ? this.getAttr("grouped") !== "false"
                    : false;
                updateBarChart(this.chart, this.transformedData.chartData, isGrouped);
                break;
        }
    }

    template() {
        if (this.isLoading()) {
            return `<div>Տվյալները բեռնվում են…</div>`;
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
                              <div class="chart-info__number">${this.transformedData.metaData.total.toLocaleString()}</div>
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

        const errorType = this.state.error;
        let errorHTML = "";

        if (errorType === true) {
            errorHTML = `<div class="error">Տվյալների բեռնման սխալ</div>`;
        } else if (errorType === "empty") {
            errorHTML = `<div class="error">Տվյալներ չկան ընտրած ժամանակահատվածի համար</div>`;
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
      ${errorHTML}
      ${chartHTML}
    `;
    }
}

// Register the component
customElements.define("chart-component", ChartComponent);
