import { DynamicElement } from "../../core/dynamic-element.js";
import { createDoughnutChart, updateDoughnutChart } from "../../core/utils/chart-utils.js";

class DoughnutChartComponent extends DynamicElement {
    constructor() {
        super();

        const baseId = this.getAttribute("id") || "doughnut";
        this.canvasId = `canvas-${baseId}`;
        this.legendId = `legend-${baseId}`;
        this.chart = null;

        this.chartData = {
            labels: ["Անուն A", "Անուն B", "Անուն C"],
            datasets: [
                {
                    data: [11, 2, 8],
                    backgroundColor: ["#4CAF50", "#FFC107", "#F44336"],
                    borderWidth: 1,
                },
            ],
        };

        this.total = 10000000;
        this.changeValue = 12;
    }

    onConnected() {
        this.render();
    }

    onAfterRender() {
        this.chart = createDoughnutChart(this.canvasId, this.chartData, this.legendId);

        updateDoughnutChart(this.chart, this.chartData, () => {
            this.$("change-indicator").setAttribute("value", this.changeValue);
        });
    }

    template() {
        return `
        <div class="chart-container chart-container_column">
         <div class="custom-legend custom-legend_data" id="${this.legendId}"></div>
            <div class="chart chart_162">
                <canvas id="${this.canvasId}"></canvas>
                <div class="chart-info">
                    <change-indicator value="0"></change-indicator>
                </div>
            </div>
           
        </div>
        `;
    }
}

customElements.define("doughnut-chart", DoughnutChartComponent);
