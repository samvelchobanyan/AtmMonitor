import { DynamicElement } from "../core/dynamic-element.js";
import "../components/dynamic/simpleTable.js";
import "../components/dynamic/filtrationTabs.js";

class Cumulative extends DynamicElement {
    constructor() {
        super();
    }

    addEventListeners() {
        // listen to submit or date change in filtration-tabs
        this.addListener(this.$("filtration-tabs"), "filter-submit", (e) => {
            let link = `/analytics/cumulative-summary?${e.detail.query}`;
            const table = this.$("simple-table");
            table.setAttribute("data-source", link);
        });
    }

    template() {
        return /*html*/ `
            <filtration-tabs></filtration-tabs>
            <div class="row">
                <div class="column sm-12">
                    <div class="table-container">  
                        <div class="container">
                            <simple-table
                                data-source="/analytics/cumulative-summary"
                                columns='[
                                    "province","deposit_amount","deposit_count",
                                    "dispense_amount","dispense_count",
                                    "exchange_eur_amount","exchange_rub_amount","exchange_usd_amount"
                                ]'
                                exportable
                                searchable="false"
                                export-filename="cumulative"
                                export-label="Download CSV">
                            </simple-table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define("cumulative-analythics", Cumulative);
