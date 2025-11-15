import { DynamicElement } from "../core/dynamic-element.js";
import "../components/dynamic/segment.js";
import "../components/dynamic/simpleGrid.js";
import "../components/dynamic/filtrationTabs.js";

class Incassate extends DynamicElement {
    constructor() {
        super();
        this.filtrationTabs = null;
        this.table = null;

        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        this.initQuery = `startDate=${year}-${month}-${day}`;

        this.tableQuery = null;
    }

    onConnected() {
        this.fetchInfoCardsData(this.initQuery);
    }

    onAfterRender() {
        this.filtrationTabs = this.$("filtration-tabs");
        this.table = this.$("simple-grid");
    }

    async fetchInfoCardsData(queryString) {
        try {
            const failedResponse = await this.fetchData(
                `/encashment/failed-transactions?${queryString}`
            );

            const totalsResponse = await this.fetchData(`/encashment/totals?${queryString}`);

            let data = { ...failedResponse.data, ...totalsResponse.data };

            this.updateInfoCards(data);
        } catch (err) {
            console.error("❌ Error fetching info cards data:", err);
        }
    }

    updateInfoCards(data) {
        this.$("#failed_amount").setAttribute("value", data.failed_transactions_amount);
        this.$("#failed_count").setAttribute("value", data.failed_transactions_count);
        this.$("#inc_count").setAttribute("value", data.total_count);
        this.$("#collected_amount").setAttribute("value", data.total_collected_amount);
        this.$("#encachment_amount").setAttribute("value", data.total_encachment_amount);
    }

    addEventListeners() {
        this.addListener(this.filtrationTabs, "filter-submit", (e) => {
            this.tableQuery = e.detail.query;
            this.table.setAttribute("data-source", `/encashment/summary?${this.tableQuery}`);
            this.fetchInfoCardsData(this.tableQuery);
        });

        this.addListener(this.table, "export-clicked", (e) => {
            e.detail.url = `/encashment/export?${this.tableQuery}`;
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
                    <div class="infos infos_margin">
                        <info-card title="Չկատարված գործարքների գումար" id='failed_amount' value-currency="֏"   value-color="color-blue" show-border="true"> </info-card>
                        <info-card title="Չկատարված գործարքների քանակ" id='failed_count' value-color="color-blue" show-border="true"> </info-card>
                        <info-card title="Ինկասացիաների քանակ" id='inc_count' value-color="color-blue" show-border="true"> </info-card>
                        <info-card title="Լիցքավորված գումար" id='encachment_amount' value-currency="֏" value-color="color-blue" show-border="true"> </info-card>
                        <info-card title="Ապալիցքավորված գումար" id='collected_amount' value-currency="֏" value-color="color-blue" show-border="true"> </info-card>
                    </div>

                    <simple-grid
                        serial
                        data-source="/encashment/summary?${this.initQuery}"
                        columns='["atm_id","date_time","atm_address", "added_amount", "collected_amount", "marked_as_empty", "limit_exceeded"]'
                        column-labels='{"atm_id":"Բանկոմատի ID","date_time":"Ամսաթիվ և ժամ","atm_address":"Բանկոմատի հասցե",
                          "added_amount":"Լիցքավորված գումար","collected_amount":"Ապալիցքավորված գումար","marked_as_empty":"Նշվել է որպես դատարկ"}'
                        column-formatters='{"collected_amount":"currency","added_amount":"currency"}'
                        hidden-columns='["limit_exceeded"]'
                        row-conditions='[
                            { "field": "row.limit_exceeded", "when": "isTrue", "class": "highlight-bg" }
                        ]'
                        mode="server"
                        per-page="10"
                        exportable>
                    </simple-grid>
                </div>
            </div>
        </div>
        `;
    }
}

customElements.define("incassate-analythics", Incassate);
