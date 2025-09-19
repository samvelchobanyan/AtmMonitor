import { DynamicElement } from "../../core/dynamic-element.js";
import { createDoughnutChart, updateDoughnutChart } from "../../core/utils/chart-utils.js";
import "../../components/static/badge.js";

class DoughnutChartComponent extends DynamicElement {
    constructor() {
        super();

        const baseId = this.getAttribute("id") || "doughnut";
        this.canvasId = `canvas-${baseId}`;
        this.legendId = `legend-${baseId}`;
        this.chart = null;

        this.chartData = null;
        this.total = null;
        this.dailyAvg = null;
        this.transactionAvg = null;
        this.changeValue = 0;
    }

    static get observedAttributes() {
        return ["data"];
    }

    onAttributeChange(name, oldValue, newValue) {
        if (name === "data" && oldValue !== newValue) {
            try {
                const parsed = JSON.parse(newValue);
                this.chartData = parsed.chartData || null;
                this.total = parsed.total || 0;
                this.dailyAvg = parsed.dailyAvg || null;
                this.transactionAvg = parsed.transactionAvg || null;
                this.changeValue = parsed.changeValue || 0;
            } catch (err) {
                console.warn("[doughnut-chart] Invalid data attribute:", err);
                this.chartData = null;
            }
        }
    }

    onAfterRender() {
        if (!this.chartData) return;
        if (!this.chart) {
            this.chart = createDoughnutChart(this.canvasId, this.chartData, this.legendId, false);
        } else {
            updateDoughnutChart(this.chart, this.chartData);
        }

        const indicator = this.$("change-indicator");
        if (indicator) indicator.setAttribute("value", this.changeValue);
    }

    template() {
        if (!this.chartData) {
            return `<div class="loading">Waiting for chart data…</div>`;
        }

        return `
          <div class="overview">
            <div class="overview-top">
              <div class="overview-top__title">Կանխիկացված գումար</div>
              <div class="overview-top__info">
                <div class="overview-top__subtitle">
                  ${this.total}<span>֏</span>
                </div>
                <div class="badges">
                  ${
                      this.dailyAvg
                          ? `<badge-item text="Օրական միջին՝ ${this.dailyAvg}֏"></badge-item>`
                          : ""
                  }
                  ${
                      this.transactionAvg
                          ? `<badge-item text="Միջին գործարք՝ ${this.transactionAvg}֏"></badge-item>`
                          : ""
                  }
                </div>
              </div>
            </div>
            <div class="chart-container chart-container_column">
              <div class="custom-legend custom-legend_data" id="${this.legendId}"></div>
              <div class="chart chart_162">
                <canvas id="${this.canvasId}" class="custom-cutout"></canvas>
                <div class="chart-info">
                  <change-indicator value="0"></change-indicator>
                </div>
              </div>
            </div>
          </div>
        `;
    }
}

customElements.define("doughnut-chart", DoughnutChartComponent);
