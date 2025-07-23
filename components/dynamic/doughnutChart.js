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

        this.chartData = {
            labels: ["Անուն A", "Անուն B", "Անուն C"],
            datasets: [
                {
                    data: [11, 100, 8],
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
        <div class="overview">
            <div class="overview-top">
                <div class="overview-top__title">Կանխիկացված գումար</div>
                <div class="overview-top__info">
                    <div class="overview-top__subtitle">
                        236,150,456<span>֏</span>
                    </div>
                   <div class="badges">
                        <badge-item text="Օրական միջին՝ 200.000.000֏"></badge-item>
                        <badge-item text="Միջին գործարք 200.000.000֏"></badge-item>
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
