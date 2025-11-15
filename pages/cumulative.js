import { DynamicElement } from "../core/dynamic-element.js";
import "../components/dynamic/simpleTable.js";
import "../components/dynamic/simpleGrid.js";
import "../components/dynamic/filtrationTabs.js";
import "../components/dynamic/doughnutChart.js";

class Cumulative extends DynamicElement {
    constructor() {
        super();
        this.fetchQuery = "";
    }

    onConnected() {
        this.fetchChartData();
    }

    async fetchChartData() {
        let url =
            this.fetchQuery != ""
                ? `/analytics/cumulative-summary?${this.fetchQuery}`
                : "/analytics/cumulative-summary";

        try {
            const res = await this.fetchData(url);
            this.chartSummary = res.data;

            if (!Array.isArray(this.chartSummary) || this.chartSummary.length === 0) {
                console.warn("⚠️ No chart data available");
                return;
            }

            // Custom labels
            const labelMap = {
                dispense_count: "Կանխիկացումների քանակ",
                dispense_amount: "Կանխիկացված գումար",
                deposit_count: "Մուտքագրումների քանակ",
                deposit_amount: "Մուտքագրված գումար",
                exchange_usd_amount: "Արտարժույթի փոխանակում դոլլար",
                exchange_rub_amount: "Արտարժույթի փոխանակում ռուբլի",
                exchange_eur_amount: "Արտարժույթի փոխանակում եվրո",
            };

            // Find all numeric keys (skip province)
            const numericKeys = Object.keys(this.chartSummary[0]).filter(
                (key) => key !== "province" && typeof this.chartSummary[0][key] === "number"
            );

            // Aggregate (sum) values per key
            const totals = numericKeys.map((key) =>
                this.chartSummary.reduce((sum, item) => sum + (item[key] || 0), 0)
            );

            // Map labels in same order
            const labels = numericKeys.map((key) => labelMap[key] || key);

            const chartPayload = {
                chartData: {
                    labels,
                    datasets: [{ data: totals }],
                },
            };

            this.$("#cumulative-chart").setAttribute("data", JSON.stringify(chartPayload));
        } catch (err) {
            console.error("❌ Error fetching chart summary:", err);
        }
    }

    addEventListeners() {
        // listen to submit or date change in filtration-tabs
        this.addListener(this.$("filtration-tabs"), "filter-submit", (e) => {
            let link = `/analytics/cumulative-summary?${e.detail.query}`;
            const table = this.$("simple-grid");
            this.fetchQuery = e.detail.query;
            table.setAttribute("data-source", link);
            this.fetchChartData();
        });

        this.addEventListener("export-clicked", (e) => {
            e.detail.url = `/analytics/cumulative-export?${this.fetchQuery}`;
        });
    }

    template() {
        return /*html*/ `
            <filtration-tabs showAtm='true'></filtration-tabs>
            <div class="row">
                <div class="column sm-12">
                    <div class="table-container">  
                        <div class="container">     
                            <doughnut-chart id="cumulative-chart" labels-right></doughnut-chart>
                            <simple-grid
                                serial
                                data-source="/analytics/cumulative-summary"
                                columns='["province","deposit_amount","deposit_count","dispense_amount","dispense_count","exchange_eur_amount","exchange_rub_amount","exchange_usd_amount"]'
                                column-labels='{"province":"Մարզ","deposit_amount":"Մուտքագրված գումար",
                                "deposit_count":"Մուտքագրված քանակ","dispense_amount":"Կանխիկացված գումար",
                                "dispense_count":"Կանխիկացված քանակ","exchange_eur_amount":"Փոխանակված EUR գումար",
                                "exchange_rub_amount":"Փոխանակված RUB գումար","exchange_usd_amount":"Փոխանակված USD գումար"}'
                                column-formatters='{"deposit_amount":"currency","dispense_amount":"currency","exchange_eur_amount":"currency","exchange_rub_amount":"currency","exchange_usd_amount":"currency"}'
                                mode="server"
                                per-page="10"
                                exportable>
                            </simple-grid>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define("cumulative-analythics", Cumulative);
