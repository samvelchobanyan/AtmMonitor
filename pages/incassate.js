import { DynamicElement } from "../core/dynamic-element.js";
import locationTransformer from "../core/utils/location-transformer.js";
import { store } from "../core/store/store.js";
import "../components/dynamic/doughnutTabs.js";
import "../components/ui/customTab.js";
import "../components/dynamic/select-box-search.js";
import "../components/ui/customCheck.js";
import "../components/dynamic/segment.js";
import "../components/dynamic/simpleTable.js";
import "../components/dynamic/select-box-date.js";
import encode from "../assets/js/utils/encode.js";

class Incassate extends DynamicElement {
    constructor() {
        super();
        this.state = {
            summary: null,
            infoCardsSummary: [],
        };
        // change link to get new data
        this.tableLink = "/encashment/summary";
        this.chosenAtms = [];
        this.province = [];
        this.cities = [];
        this.districts = [];

        this.activeTab = "province";
        this.checkedValues = new Set();

        this.submitButton = null;
        this.selectCityBox = null;
        this.selectDistrictBox = null;
        this.selectSegmentBox = null;
        this.dateSelectBox = null;
        this.segments = null;
    }

    onConnected() {
        const state = store.getState();

        this.province = state.regionsData.map((item) => ({
            label: item.province,
            value: item.province,
        }));

        this.cities = locationTransformer.getAllCityOptions(state.regionsData);
        this.districts = locationTransformer.getAllDistrictOptions(state.regionsData);

        this.fetchSummary();
        this.fetchInfoCardData();
    }

    onAfterRender() {
        const tableContainer = this.$(".table-container");
        if (tableContainer) {
            tableContainer.innerHTML = this.renderTable(this.tableLink);
        }

        this.submitButton = this.$(".btn_blue");
        this.selectCityBox = this.$("#city-search");
        this.selectDistrictBox = this.$("#districts-search");
        this.selectSegmentBox = this.$("#segments-search");
        this.dateSelectBox = this.$("select-box-date");

        this.tabsListener();
    }

    async fetchInfoCardData(queryString) {
        try {
            const response = await this.fetchData(
                `/encashment/failed-transactions?${queryString.toString()}`
            );
            this.setState({ infoCardsSummary: response.data });
        } catch (err) {
            console.error("❌ Error fetching summary:", err);
            this.setState({ infoCardsSummary: [] });
        }
    }

    async fetchSummary(region, city, province, segmentId) {
        const queryString = new URLSearchParams();
        if (region) {
            queryString.append("district", region);
        }
        if (city) {
            queryString.append("city", city);
        }
        if (province) {
            queryString.append("province", province);
        }
        if (segmentId) {
            queryString.append("segmentId", segmentId);
        }

        // for test to get data
        queryString.append("startDate", "2025-06-27");
        queryString.append("startDate", "2025-08-11");

        this.fetchInfoCardData(queryString);
        try {
            this.tableLink = `/encashment/summary?${queryString}`;
        } catch (err) {
            console.error("❌ Error fetching summary:", err);
        }
    }

    onStoreChange(storeState) {
        this.segments = storeState.segments.map((item) => ({
            value: item.id,
            text: item.name,
        }));
    }

    addEventListeners() {
        this.submitButtonListener();
        this.checkboxesListener();

        if (this.dateSelectBox) {
            this.addListener(this.dateSelectBox, "date-range-change", (e) => {
                const { startDate, endDate } = e.detail || {};
                if (!startDate || !endDate) return;

                this.setAttribute("start-date", startDate);
                this.setAttribute("end-date", endDate);

                const queryString = this.buildQueryString(startDate, endDate);
                this.fetchInfoCardData(queryString);
                this.tableLink = `/encashment/summary?${queryString}`;

                const tableContainer = this.$(".table-container");
                if (tableContainer) {
                    tableContainer.innerHTML = this.renderTable(this.tableLink);
                }
            });
        }
    }

    checkboxesListener() {
        const checkboxes = this.$$("custom-checkbox");

        checkboxes.forEach((checkbox) => {
            const val = checkbox.getAttribute("value");

            this.addListener(checkbox, "change", () => {
                const input = checkbox.querySelector('input[type="checkbox"]');

                if (input && input.checked) {
                    this.checkedValues.add(val);
                } else {
                    this.checkedValues.delete(val);
                }
            });
        });
    }

    submitButtonListener() {
        if (!this.submitButton) return;

        this.addListener(this.submitButton, "click", () => {
            const dateComponent = this.querySelector("select-box-date");
            const startDate = dateComponent?.startDate || null;
            const endDate = dateComponent?.endDate || null;

            const queryString = this.buildQueryString(startDate, endDate);
            this.fetchInfoCardData(queryString);

            this.tableLink = `/encashment/summary?${queryString}`;
            const tableContainer = this.$(".table-container");
            if (tableContainer) {
                tableContainer.innerHTML = this.renderTable(this.tableLink);
            }
        });
    }

    tabsListener() {
        const tabs = this.$$("custom-tab");

        tabs.forEach((tab) => {
            this.addListener(tab, "click", () => {
                const selectedTabName = tab.getAttribute("name");

                // Store active tab so submitButtonListener knows which one is active
                this.activeTab = selectedTabName;
            });
        });
    }

    renderTable(link) {
        return /*html*/ `
            <simple-table
                data-source=${link}
                columns='["date_time","atm_address", "added_amount", "collected_amount", "marked_as_empty"]'
                exportable
                export-filename="incassate"
                export-label="Download CSV">
            </simple-table>
        `;
    }

    buildQueryString(startDate = null, endDate = null) {
        const queryString = new URLSearchParams();

        // Add tab-specific filters
        if (this.activeTab === "province") {
            const checkedValues = Array.from(this.checkedValues);
            const segments = this.querySelector("segment-block[name='province-segments']");
            checkedValues.forEach((v) => queryString.append("provinces", v));
            if (segments?.values?.length)
                segments.values.forEach((v) => queryString.append("segmentIds", v));
        } else if (this.activeTab === "city") {
            const values = this.selectCityBox.getAttribute("value")?.split(",") || [];
            values.forEach((v) => queryString.append("cities", v));
            const segments = this.querySelector("segment-block[name='city-segments']");
            if (segments?.values?.length)
                segments.values.forEach((v) => queryString.append("segmentIds", v));
        } else if (this.activeTab === "district") {
            const values = this.selectDistrictBox.getAttribute("value")?.split(",") || [];
            values.forEach((v) => queryString.append("districts", v));
            const segments = this.querySelector("segment-block[name='district-segments']");
            if (segments?.values?.length)
                segments.values.forEach((v) => queryString.append("segmentIds", v));
        } else if (this.activeTab === "segment") {
            const rawVal = this.selectSegmentBox.getAttribute("value") || "[]";
            JSON.parse(rawVal).forEach((v) => queryString.append("segmentIds", Number(v)));
        }
        // Add date filters if provided
        if (startDate) queryString.append("startDate", startDate);
        if (endDate) queryString.append("endDate", endDate);

        return queryString;
    }

    template() {
        const cities = encode(this.cities);
        const districts = encode(this.districts);
        const segments = encode(this.segments);

        return /*html*/ `
        <div class="row">
            <div class="column sm-12">
                <div class="container">
                    <div class="tabs-container">
                        <div class="tabs">
                            <custom-tab name="province" active>Մարզ</custom-tab>
                            <custom-tab name="city">Քաղաք</custom-tab>
                            <custom-tab name="district">Համայնք</custom-tab>
                            <custom-tab name="segment">Սեգմենտ</custom-tab>
                        </div>
                        <select-box-date
                            start-date="${this.getAttr("start-date")}"
                            end-date="${this.getAttr("end-date")}"
                        ></select-box-date>
                    </div>
                    <div class="tab-content" data-tab="province">
                    <div class="checkboxes">
                            ${this.province
                                .map(
                                    (el) =>
                                        `<custom-checkbox id="${el.value}" value="${el.value}"   ${
                                            this.checkedValues.has(el.value) ? "checked" : ""
                                        }>${el.label} </custom-checkbox>`
                                )
                                .join("")}
                    </div>  
                    <segment-block decor name='province-segments'></segment-block>
                </div>
                  <div class="tab-content" data-tab="city" style="display:none">
                       <select-box-search placeholder="Որոնել Քաղաք" options='${cities}' id='city-search'></select-box-search>
                       <segment-block decor name='city-segments'></segment-block>
                    </div>
                    <div class="tab-content" data-tab="district" style="display:none">
                       <select-box-search placeholder="Որոնել Համայնք" options='${districts}' id='districts-search'></select-box-search>
                       <segment-block decor name='district-segments'></segment-block>
                    </div>
                    <div class="tab-content" data-tab="segment" style="display:none">
                        <select-box-search placeholder="Որոնել Սեգմենտ" options='${segments}' id='segments-search'></select-box-search>
                    </div>
                   <div class="btn-container btn-container_decor">
                        <button type="submit" class="btn btn_fit btn_blue btn_md">Հաստատել</button>
                    </div>
                </div>
            </div> 
        </div>
        <div class="row">
            <div class="column sm-12">
            <div class="container">
                 <div class="select-container">
                    <container-top icon="icon-coins" title="Ինկասացիաներ"> </container-top>
                </div>
                <div class="row">
                    <div class="column sm-6">
                        <div class="infos infos_margin">
                            <info-card title="Այսօրվա ինկասացիաներ" value="${
                                this.state.infoCardsSummary.failed_transactions_count
                            }" value-color="color-blue" icon="icon icon-box" show-border="true"> </info-card>
                            <info-card title="Այսօր հետ բերված գումար" value="${
                                this.state.infoCardsSummary.failed_transactions_amount
                            }" value-currency="֏" value-color="color-blue" icon="icon icon-arrow-down-left" show-border="true"> </info-card>
                        </div>
                    </div>
                </div>
                <div class="table-container"></div>
            </div>
        </div>


        `;
    }
}

customElements.define("incassate-analythics", Incassate);
