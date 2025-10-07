import { DynamicElement } from "../core/dynamic-element.js";
import "../components/dynamic/segment.js";
import "../components/dynamic/simpleTable.js";
import "../components/dynamic/filtrationTabs.js";

class Incassate extends DynamicElement {
    constructor() {
        super();
        // change link to get new data
        this.tableLink = "/encashment/summary";
        this.filtrationTabs = null;
    }

    onConnected() {
        this.fetchSummary();
    }

    onAfterRender() {
        this.filtrationTabs = this.$("filtration-tabs");
    }

    async fetchSummary(queryString) {
        try {
            const response = await this.fetchData(`/encashment/failed-transactions?${queryString}`);

            const tableContainer = this.$(".table-container");
            if (tableContainer) {
                tableContainer.innerHTML = this.renderTableCards(response.data);
            }
        } catch (err) {
            console.error("❌ Error fetching summary:", err);
        }
    }

    addEventListeners() {
        this.addListener(this.filtrationTabs, "filter-submit", (e) => {
            const queryString = e.detail.query;
            this.tableLink = `/encashment/summary?${queryString}`;
            this.fetchSummary(queryString);
        });
    }

    renderTableCards(infoCardData) {
        return /*html*/ `
          <div class="row">
                    <div class="column sm-6">
                        <div class="infos infos_margin">
                            <info-card title="Այսօրվա ինկասացիաներ" value="${infoCardData.failed_transactions_count ??
                                0}"    value-color="color-blue" icon="icon icon-box" show-border="true"> </info-card>
                            <info-card title="Այսօր հետ բերված գումար" value="${infoCardData.failed_transactions_amount ??
                                0}"  value-currency="֏" value-color="color-blue" icon="icon icon-arrow-down-left" show-border="true"> </info-card>
                        </div>
                    </div>
                </div>
            <simple-table
                data-source=${this.tableLink}
                columns='["date_time","atm_address", "added_amount", "collected_amount", "marked_as_empty"]'
                column-labels='{"date_time":"Ամսաթիվ և ժամ","atm_address":"Բանկոմատի ID և հասցե",
                "added_amount":"Ավելացված գումար","collected_amount":"Հավաքված գումար",
                "marked_as_empty":"Դատարկ"}'
                exportable
                export-filename="incassate"
                export-label="Download CSV">
            </simple-table>
        `;
    }

    template() {
        return /*html*/ `
        <filtration-tabs></filtration-tabs>
        <div class="row">
            <div class="column sm-12">
            <div class="container">
                 <div class="select-container">
                    <container-top icon="icon-coins" title="Ինկասացիաներ"> </container-top>
                </div>
              
                <div class="table-container"></div>
            </div>
        </div>
        `;
    }
}

customElements.define("incassate-analythics", Incassate);
