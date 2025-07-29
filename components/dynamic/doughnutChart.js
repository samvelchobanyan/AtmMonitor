import { DynamicElement } from "../../core/dynamic-element.js";
import { createDoughnutChart, updateDoughnutChart } from "../../core/utils/chart-utils.js";
import "../../components/static/badge.js";
import chartDataTransformer from "../../core/utils/data-transformer.js";

const observedAttrs = ["api-url", "initdata", "title"];
class DoughnutChartComponent extends DynamicElement {
  constructor() {
    super();

    const baseId = this.getAttribute("id") || "doughnut";
    this.title = this.getAttribute("title") || "";
    this.canvasId = `canvas-${baseId}`;
    this.legendId = `legend-${baseId}`;
    this.chart = null;
    this.selectedPeriod = this._dateToPeriod();
    this.selectBox = null;
    let stringifiedData = this.getAttr("initdata");
    this.transformedData = null;
    this.chartType = this.getAttribute("type") || "";
    try {
      this.chartData = stringifiedData ? JSON.parse(stringifiedData) : null;
    } catch (e) {
      console.error("Invalid initData JSON:", stringifiedData, e);
      this.chartData = null;
    }
    this.changeValue = 12;
  }

  static get observedAttributes() {
    return observedAttrs;
  }
  _dateToPeriod() {
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

    return period;
  }

  onConnected() {
    this.render();
  }

  onAfterRender() {
    this.selectBox = this.$("select-box");

    // extract those props which needed in this chart according on type
    let filteredBreakdown = {};

    const breakdown = this.chartData.card_breakdown;
    if (breakdown) {
      const field = this.chartType === "amount" ? "amount" : "count";
      filteredBreakdown = {
        [`with_card_${field}`]: breakdown.with_card?.[field] ?? 0,
        [`without_card_${field}`]: breakdown.without_card?.[field] ?? 0,
      };
    }

    // should transform data
    this.transformedData = chartDataTransformer.transformDoughnutData(filteredBreakdown);
    this.chart = createDoughnutChart(this.canvasId, this.transformedData.chartData, this.legendId);

    updateDoughnutChart(this.chart, this.transformedData.chartData, () => {
      this.$("change-indicator").setAttribute("value", this.changeValue);
    });
  }
  addEventListeners() {
    // Override in child classes to set up template-based event listeners
    // Called after every render for elements inside the component's innerHTML
    // Example:
    if (this.selectBox) {
      this.addListener(this.selectBox, "change", this.onSelectChange);
    }
  }

  onSelectChange(e) {
    let dateRangeObj = null;

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
  template() {
    let data = this.chartData;
    let text = this.chartType == "amount" ? "Կանխիկացված գումար" : "Կանխիկացումների քանակ";
    let changedPercent =
      this.chartType == "amount"
        ? data.dispense_amount_percent_change
        : data.dispense_count_percent_change;

    if (this.isLoading()) {
      return `<div>Loading chart…</div>`;
    }

    return `
        <div class="overview">
            <div class="overview-top">
                <div class="overview-top__title">${text}</div>
                <div class="overview-top__info">
                    <div class="overview-top__subtitle">
                       <p> ${this.title}<span>֏</span></p>
                    </div>
                   <div class="badges">
                        <badge-item text="Օրական միջին՝ ${data.daily_median}֏"></badge-item>
                        <badge-item text="Միջին գործարք ${data.transaction_median}֏"></badge-item>
                    </div>
                </div>
            </div>
            <div class="chart-container chart-container_column">
                <div class="custom-legend custom-legend_data" id="${this.legendId}"></div>
                <div class="chart chart_162">
                    <canvas id="${this.canvasId}" class="custom-cutout"></canvas>
                    <div class="chart-info">
                        <change-indicator value=${changedPercent}></change-indicator>
                    </div>
                </div>
            </div>
        </div>
    `;
  }
}

customElements.define("doughnut-chart", DoughnutChartComponent);
