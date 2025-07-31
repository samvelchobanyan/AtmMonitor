import { DynamicElement } from "../../core/dynamic-element.js";
import { createDoughnutChart, updateDoughnutChart } from "../../core/utils/chart-utils.js";
import "../../components/static/badge.js";
import chartDataTransformer from "../../core/utils/data-transformer.js";

const observedAttrs = ["api-url", "initdata", "title", "percentchange", "activetab"];
class DoughnutChartComponent extends DynamicElement {
    constructor() {
        super();

        const baseId = this.getAttribute("id") || "doughnut";
        this.title = this.getAttribute("title") || "";
        this.percentChange = this.getAttribute("percentchange") || "";
        this.canvasId = `canvas-${baseId}`;
        this.legendId = `legend-${baseId}`;
        this.chart = null;
        this.selectedPeriod = this._dateToPeriod();
        this.selectBox = null;
        let stringifiedData = this.getAttr("initdata");
        this.transformedData = null;
        this.chartType = this.getAttribute("type") || "";
        this.activeTab = this.getAttribute("activetab") || "";
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
    onAttributeChange(name, oldValue, newValue) {
        if (name === "activetab" && oldValue !== newValue) {
            this.activeTab = newValue;
            this.render();
        }
    }

    onAfterRender() {
        this.selectBox = this.$("select-box");
        console.log("!!!!", this.activeTab);

        // extract those props which needed in this chart according on type
        let filteredBreakdown = {};
        let field;
        if (this.activeTab == "deposit_by_method") {
            // todo :ask them to change this prop from total amount to amount, to avoid condition
            field = this.chartType === "amount" ? "total_amount" : "count";
        } else {
            field = this.chartType === "amount" ? "amount" : "count";
        }
        const breakdown = this.chartData.card_breakdown;
        const depositTypeBreakdown = this.chartData.deposit_type_breakdown || null;
        if (breakdown && this.activeTab)
            if (
                this.activeTab == "with_without_card" ||
                this.activeTab == "deposit_with_without_card"
            ) {
                filteredBreakdown = {
                    with_card: breakdown.with_card?.[field] ?? 0,
                    without_card: breakdown.without_card?.[field] ?? 0,
                };
            } else if (this.activeTab == "by_method") {
                // right code
                // breakdown.by_method.map((method) => {
                //     return (filteredBreakdown[method["method_name"]] = method[field]);
                // });

                // no data in api yet, can use this to test
                filteredBreakdown = {
                    master: 5454,
                    visa: 1200,
                    arca: 102,
                };
            } else if (this.activeTab == "own_other_card") {
                // right code
                // filteredBreakdown = {
                //     own_card: breakdown.own_card?.[field] ?? 0,
                //     other_card: breakdown.other_card?.[field] ?? 0,
                // };

                // no data in api yet, can use this to test
                filteredBreakdown = {
                    own_card: 3454,
                    other_card: 12100,
                };
            } else if (this.activeTab == "deposit_by_method") {
                let fakeData = [
                    {
                        count: 8,
                        deposit_type_id: 10,
                        deposit_type_name: "Մուտքագրում ",
                        total_amount: 16000,
                    },
                    {
                        count: 7,
                        deposit_type_id: 1,
                        deposit_type_name: "Մուտքագրում քարտին",
                        total_amount: 14000,
                    },
                    {
                        count: 10,
                        deposit_type_id: 2,
                        deposit_type_name: " քարտին",
                        total_amount: 10000,
                    },
                ];
                // depositTypeBreakdown.map((type) => {
                //     return (filteredBreakdown = {
                //         deposit_type_id: type.deposit_type_id,
                //         deposit_type_name: type.deposit_type_name,
                //         number: type[field],
                //     });
                // });
                filteredBreakdown = fakeData.map((type) => ({
                    deposit_type_id: type.deposit_type_id,
                    deposit_type_name: type.deposit_type_name,
                    number: type[field], // make sure field is defined and valid
                }));
            }

        //todo continue here, should handle somehow custom label from api

        // should transform data
        this.transformedData = chartDataTransformer.transformDoughnutData(filteredBreakdown);

        this.chart = createDoughnutChart(this.canvasId, this.transformedData.chartData, this.legendId, false);

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
                        <change-indicator value=${this.percentChange}></change-indicator>
                    </div>
                </div>
            </div>
        </div>
    `;
    }
}

customElements.define("doughnut-chart", DoughnutChartComponent);
