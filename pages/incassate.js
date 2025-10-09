import { DynamicElement } from "../core/dynamic-element.js";
import "../components/dynamic/segment.js";
import "../components/dynamic/simpleTable.js";
import "../components/dynamic/filtrationTabs.js";

class Incassate extends DynamicElement {
    constructor() {
        super();
        this.filtrationTabs = null;
        this.table = null;
    }

    onConnected() {
        this.fetchSummary("");
    }

    onAfterRender() {
        this.filtrationTabs = this.$("filtration-tabs");
        this.table = this.$("simple-table");
    }

    async fetchSummary(queryString) {
        try {
            const response = await this.fetchData(`/encashment/failed-transactions?${queryString}`);

            this.updateInfoCards(response.data);
        } catch (err) {
            console.error("❌ Error fetching summary:", err);
        }
    }

    updateInfoCards(data) {
        this.$("#failed_amount").setAttribute("value", data.failed_transactions_amount);
        this.$("#failed_count").setAttribute("value", data.failed_transactions_count);
    }

    addEventListeners() {
        this.addListener(this.filtrationTabs, "filter-submit", (e) => {
            const queryString = e.detail.query;
            this.table.setAttribute("data-source", `/encashment/summary?${queryString}`);

            this.fetchSummary(queryString);
        });
    } 

    template() {
        return /*html*/ `
        <filtration-tabs showAtm='true'></filtration-tabs>
        <div class="row">
            <div class="column sm-12">
            <div class="container">
                 <div class="select-container">
                    <container-top icon="icon-coins" title="Ինկասացիաներ"> </container-top>
                </div>
              
            <div class="table-container">  
                <div class="row">
                    <div class="column sm-6">
                        <div class="infos infos_margin">
                            <info-card title="Չկատարված գործարքների գումար" id='failed_amount' value-currency="֏"   value-color="color-blue" show-border="true"> </info-card>
                            <info-card title="Չկատարված գործարքների քանակ" id='failed_count' value-color="color-blue" show-border="true"> </info-card>
                        </div>
                    </div>
                </div>
                <simple-table
                    data-source="/encashment/summary"
                    columns='["date_time","atm_address", "added_amount", "collected_amount", "marked_as_empty"]'
                    column-labels='{"date_time":"Ամսաթիվ և ժամ","atm_address":"Բանկոմատի ID և հասցե",
                    "added_amount":"Ավելացված գումար","collected_amount":"Հավաքված գումար",
                    "marked_as_empty":"Դատարկ"}'
                    exportable
                    export-filename="incassate"
                    export-label="Ներբեռնել CSV-ն">
                </simple-table>
            </div>
            </div>
        </div>
        `;
    }
}

customElements.define("incassate-analythics", Incassate);
