import { DynamicElement } from "../core/dynamic-element.js";
import "../components/dynamic/chartComponent.js";
import "../components/dynamic/infoCard.js";
import "../components/ui/customTab.js";
import "../components/dynamic/simpleGrid.js";
import "../components/dynamic/select-box.js";
import "../components/dynamic/select-box-date.js";
import "../components/ui/customTab.js";
import "../components/dynamic/select-box-search.js";
import "../components/ui/customCheck.js";
import "../components/dynamic/segment.js";
import "../components/dynamic/filtrationTabs.js";

class AtmFailures extends DynamicElement {
    constructor() {
        super();

        this.topStartDate = null;
        this.topEndDate = null;
        this.topDateSelectBox = null;
        this.tableActiveTab = null;
        this.filtrationTabs = null;
        this.bottomTable = null;
        this.filtrationQuery = null;

        this.deviceTypes = [{ id: 0, type_name: "Բոլորը" }];
    }

    onConnected() {
        this.initTableTabs();
    }

    onAfterRender() {
        this.topDateSelectBox = this.$("#top-date");
        this.filtrationTabs = this.$("filtration-tabs");
        this.bottomTable = this.$("#bottom_table");

        this.fetchTopSummary();
    }

    addEventListeners() {
        this.selectTopDateListener();

        this.addListener(this.filtrationTabs, "filter-submit", (e) => {
            const queryString = e.detail.query;
            this.filtrationQuery = queryString;

            if (this.tableActiveTab == 0) {
                this.$("#bottom_table").setAttribute(
                    "data-source",
                    `/device-faults/by-device-type?${queryString}`
                );
            } else {
                this.$("#bottom_table").setAttribute(
                    "data-source",
                    `/device-faults/by-device-type?deviceIds=${this.tableActiveTab}&${queryString}`
                );
            }
        });

        this.addListener(this.$("#top_table"), "export-clicked", (e) => {
            e.detail.url = `/device-faults/top-export?startDate=${this.topStartDate}&endDate=${this.topEndDate}`;
        });

        this.addListener(this.bottomTable, "export-clicked", (e) => {
            e.detail.url = `/device-faults/by-device-type-export?${this.filtrationQuery}`;
        });
    }

    async fetchTopSummary() {
        const queryString = new URLSearchParams();
        if (this.topStartDate) queryString.append("startDate", this.topStartDate);
        if (this.topEndDate) queryString.append("endDate", this.topEndDate);

        try {
            this.$("#top_table").setAttribute("data-source", `/device-faults/top?${queryString}`);
        } catch (err) {
            console.error("❌ Error fetching top summary:", err);
        }
    }

    async initTableTabs() {
        try {
            const res = await this.fetchData(`/device-faults/all-device-types`);
            this.tableActiveTab = this.deviceTypes[0].id;
            this.deviceTypes = [...this.deviceTypes, ...res.data];

            const tableContainer = this.$(".table_tabs");
            if (tableContainer) {
                tableContainer.innerHTML = this.deviceTypes
                    .map(
                        (type) =>
                            `<custom-tab name="${type.id}" ${type.id == 0 ? "active" : ""}>${
                                type.type_name
                            }</custom-tab>`
                    )
                    .join("");
                this.tableTabsListener();
            }
        } catch (err) {
            console.error("❌ Failed to init table tabs:", err);
        }
    }

    tableTabsListener() {
        const tableTabs = this.$$(".table_tabs custom-tab");

        tableTabs.forEach((tab) => {
            this.addListener(tab, "click", async () => {
                const selectedTab = tab.getAttribute("name");
                if (this.tableActiveTab === selectedTab) return;
                this.tableActiveTab = selectedTab;
                if (selectedTab == 0) {
                    this.bottomTable.setAttribute(
                        "data-source",
                        `/device-faults/by-device-type?${
                            this.filtrationQuery ? `&${this.filtrationQuery}` : ""
                        }`
                    );
                } else {
                    this.filtrationQuery = `${this.filtrationQuery}&deviceIds=${selectedTab}`;

                    this.bottomTable.setAttribute(
                        "data-source",
                        `/device-faults/by-device-type?${this.filtrationQuery}`
                    );
                }
            });
        });
    }

    selectTopDateListener() {
        if (this.topDateSelectBox) {
            this.addListener(this.topDateSelectBox, "date-range-change", (e) => {
                const { startDate, endDate } = e.detail || {};
                if (!startDate || !endDate) return;
                this.topStartDate = startDate;
                this.topEndDate = endDate;

                this.fetchTopSummary();
            });
        }
    }

    template() {
        return /*html*/ `
            <div class="row">
                <div class="column sm-12">
                    <div class="container">
                            <div class="select-container">
                                <container-top icon="icon-x-octagon" title="Ամենահաճախ փչացող 10 բանկոմատները"> </container-top>
                                <select-box-date
                                    start-date="${this.topStartDate ? this.topStartDate : ""}"
                                    end-date="${this.topEndDate ? this.topEndDate : ""}"
                                    id='top-date'
                                ></select-box-date>
                            </div>

                            <div class="container top_table"> 
                                <simple-grid
                                    id='top_table'
                                    data-source = '/device-faults/top'
                                    columns='["atm_id", "address", "total_faults", "faults_summary"]'
                                    column-labels='{
                                        "atm_id": "Բանկոմատի ID",
                                        "address": "Հասցե",
                                        "total_faults": "Խափանումների քանակ",
                                        "faults_summary": "Խափանումների նկարագրություն"
                                        }'
                                    searchable="false"
                                    mode="server" 
                                    exportable
                                ></simple-grid>
                                  
                            </div>
                    </div>
                  </div>
            </div>

            <filtration-tabs showAtm='true'></filtration-tabs>

            <div class='row'>
                <div class="column sm-12">
                    <div class="container">
                        <div class="tabs table_tabs">
                         ${this.deviceTypes
                             .map(
                                 (type) =>
                                     `<custom-tab name="${type.type_name}" ${
                                         type.type_name == this.tableActiveTab ? "active" : ""
                                     }>${type.type_name}</custom-tab>`
                             )
                             .join("")}
                            </div>

                        
                        <div class="container bottom_table">
                            <simple-grid
                                id='bottom_table'
                                columns='["atm_id", "address", "total_faults", "faults_duration"]'
                                data-source='/device-faults/by-device-type'
                                column-labels='{
                                    "atm_id": "Բանկոմատի ID",
                                    "address": "Հասցե",
                                    "total_faults": "Խափանումների քանակ",
                                    "faults_duration": "Խափանումների տևողություն"
                                    }'
                                mode="server" 
                                exportable
                                searchable="false">
                            </simple-grid>
                        </div>

                    </div>
                </div>
            </div>
        </div>
      `;
    }
}

customElements.define("atm-failures", AtmFailures);
