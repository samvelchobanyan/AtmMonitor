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
import "../components/dynamic/doughnutChart.js";
import { getTodayDate } from "../core/utils/date-utils.js";

class AtmFailures extends DynamicElement {
    constructor() {
        super();

        this.topStartDate = null;
        this.topEndDate = null;
        this.topDateSelectBox = null;
        this.tableActiveTab = null;
        this.filtrationTabs = null;
        this.bottomTable = null;
        this.repairSummaryTable = null;
        this.filtrationQuery = null;
        this.chartSummary = null;
        this.deviceTypes = [{ id: 0, type_name: "Բոլորը" }];

        this.todayDate = getTodayDate();
    }

    onConnected() {
        this.initTableTabs();
    }

    onAfterRender() {
        this.topDateSelectBox = this.$("#top-date");
        this.filtrationTabs = this.$("filtration-tabs");
        this.bottomTable = this.$("#bottom_table");
        this.repairSummaryTable = this.$("#repair_summary_table");
        this.topTable = this.$("#top_table");

        this.fetchBottomSummary();
    }

    addEventListeners() {
        this.addListener(this.filtrationTabs, "filter-submit", (e) => {
            const queryString = e.detail.query;
            this.filtrationQuery = queryString;

            this.fetchBottomSummary(queryString);

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

            if (this.repairSummaryTable) {
                this.repairSummaryTable.setAttribute(
                    "data-source",
                    `/device-faults/repair-summary?${queryString}`
                );
            }

            if (this.topTable) {
                this.topTable.setAttribute(
                    "data-source",
                    `/device-faults/top?${queryString}`
                );
            }
        });

        this.addListener(this.$("#top_table"), "export-clicked", (e) => {
            e.detail.url = `/device-faults/top-export?${this.filtrationQuery}`;
        });

        this.addListener(this.bottomTable, "export-clicked", (e) => {
            e.detail.url = `/device-faults/by-device-type-export?${this.filtrationQuery}`;
        });

        // this.addListener(this.repairSummaryTable, "export-clicked", (e) => {
        //     e.detail.url = `/device-faults/repair-summary?${this.filtrationQuery}`;
        // });
    }

    async fetchBottomSummary(queryString) {
        //todo uncomment - right one
        // let url = queryString
        //     ? `/device-faults/by-device-type?${queryString}`
        //     : "/device-faults/by-device-type";

        // for test
        console.log('fetching bottom summary',queryString);
        
        let url = queryString
            ? `/device-faults/by-device-type?${queryString}`
            : "/device-faults/by-device-type?startDate=2025-05-10&endDate=2025-10-05";

            
        try {
            const res = await this.fetchData(url);
            this.chartSummary = res.data;
            const labels = this.chartSummary.map((item) => item.device_type);
            const dataValues = this.chartSummary.map((item) => item.atms.length);

            const chartPayload = {
                chartData: {
                    labels,
                    datasets: [{ data: dataValues }],
                },
            };

            this.$("#failures-chart").setAttribute("data", JSON.stringify(chartPayload));
        } catch (err) {
            console.error("❌ Error fetching chart summary:", err);
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
                    const params = new URLSearchParams(this.filtrationQuery || "");
                    params.delete("deviceIds");
                    const qs = params.toString();
                    this.filtrationQuery = qs;
                    this.bottomTable.setAttribute(
                        "data-source",
                        qs ? `/device-faults/by-device-type?${qs}` : `/device-faults/by-device-type`
                    );
                } else {
                    const params = new URLSearchParams(this.filtrationQuery || "");
                    params.set("deviceIds", selectedTab);
                    const qs = params.toString();
                    this.filtrationQuery = qs;
                    this.bottomTable.setAttribute(
                        "data-source",
                        `/device-faults/by-device-type?${qs}`
                    );
                }
            });
        });
    }

    template() {
        return /*html*/ `
            <filtration-tabs showAtm='true'></filtration-tabs>

            <div class="row">
                <div class="column sm-12">
                    <div class="container">
                            <div class="select-container">
                                <container-top icon="icon-x-octagon" title="Ամենահաճախ փչացող 10 բանկոմատները"> </container-top>
                            </div>

                            <div class="container top_table"> 
                                <simple-grid
                                    id='top_table'
                                    data-source = '/device-faults/top?startDate=${this.todayDate}&endDate=${this.todayDate}'
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

            <div class='row'>
                <div class="column sm-12">
                    <div class="container">
                       <doughnut-chart id="failures-chart" labels-right></doughnut-chart>
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
                                data-source='/device-faults/by-device-type?startDate=${this.todayDate}&endDate=${this.todayDate}'
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
            
            <div class="row">
                <div class="column sm-12">
                    <div class="container">
                    <container-top icon="icon-x-octagon" title="Անսարքությունների վերանորգման ժամանակ"> </container-top>
                        <simple-grid
                            id="repair_summary_table"
                            data-source="/device-faults/repair-summary?startDate=${this.todayDate}&endDate=${this.todayDate}"
                            columns='[
                                "atm_name",
                                "error_date",
                                "mail_sent_at",
                                "fixed_at",
                                "actual_repair_hours",
                                "repair_time",
                                "device_type",
                                "description"
                            ]'
                            column-labels='{
                                "atm_name": "Բանկոմատի ID",
                                "error_date": "խափանման ամսաթիվ",
                                "mail_sent_at": "տեղեկացում",
                                "fixed_at": "վերկանգնում",
                                "actual_repair_hours": "վերանորգման ժամանակ",
                                "repair_time": "վերանարոգման սահմանաչափ",
                                "device_type": "սարքի տեսակ",
                                "description": "նկարագրություն"
                            }'
                            mode="server"
                            per-page="10"
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
