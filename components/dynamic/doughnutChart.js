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
                console.log("yes");

                const parsed = JSON.parse(newValue);
                console.log("parsed", parsed);

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
        console.log("this.chartData", this.chartData);
        console.log("this.chart", this.chart);

        if (!this.chartData) return;
        if (!this.chart) {
            this.chart = createDoughnutChart(this.canvasId, this.chartData, this.legendId, false);
        } else {
            console.log("else");

            updateDoughnutChart(this.chart, this.chartData);
        }

        const indicator = this.$("change-indicator");
        if (indicator) indicator.setAttribute("value", this.changeValue);
    }

    template() {
        if (!this.chartData) {
            return `<div class="loading">Waiting for chart data…</div>`;
        }
        let suffix = this.getAttr("currency") ? "<span>֏</span>" : "";
        let labelsRight = this.hasAttribute("labels-right");

        if (labelsRight) {
            return /* html */ `
            <div class="chart-container chart-container_column" style='justify-content:center; gap:50px'>
              <div class="chart chart_228">
                <canvas id="${this.canvasId}" class="custom-cutout"></canvas>
              </div>
              <div class="custom-legend custom-legend_right flex align-middle" id="${this.legendId}"></div>
            </div>
        `;
        } else {
            return /* html */ `
          <div class="overview">
            <div class="overview-top">
              <div class="overview-top__title">${this.getAttr("title")}</div>
              <div class="overview-top__info">
                <div class="overview-top__subtitle">
                  ${this.total.toLocaleString() + suffix}
                </div>
                <div class="badges">
                  ${
                      this.dailyAvg
                          ? `<badge-item text="Օրական միջին՝ ${this.dailyAvg.toLocaleString() +
                                suffix}"></badge-item>`
                          : ""
                  }
                  ${
                      this.transactionAvg
                          ? `<badge-item text="Միջին գործարք՝ ${this.transactionAvg.toLocaleString() +
                                suffix}"></badge-item>`
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
}

customElements.define("doughnut-chart", DoughnutChartComponent);
