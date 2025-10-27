import { DynamicElement } from "../core/dynamic-element.js";
import "../components/dynamic/simpleTable.js";
import "../components/dynamic/simpleGrid.js";
import "../components/dynamic/filtrationTabs.js";

class Cumulative extends DynamicElement {
    constructor() {
        super();
        this.fetchQuery = "";
    }

    addEventListeners() {
        // listen to submit or date change in filtration-tabs
        this.addListener(this.$("filtration-tabs"), "filter-submit", (e) => {
            let link = `/analytics/cumulative-summary?${e.detail.query}`;
            const table = this.$("simple-grid");
            this.fetchQuery = e.detail.query;
            table.setAttribute("data-source", link);
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
                            <simple-grid
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
