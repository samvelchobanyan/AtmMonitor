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

class Cumulative extends DynamicElement {
    constructor() {
        super();
        this.state = {
            atmsList: [],
            segments: [],
        };
        // change link to get new data
        this.tableLink = "/analytics/cumulative-summary";
        this.province = [];
        this.cities = [];
        this.districts = [];

        this.currentRegion = null;

        this.currentCity = null;

        this.activeTab = "";
        this.checkedValues = new Set();

        this.submitButton = null;
        this.selectCityBox = null;
        this.selectDistrictBox = null;
        this.selectSegmentBox = null;
        this.selectAtmsBox = null;
        this.dateSelectBox = null;
    }

    // todo: design fix

    onConnected() {
        const state = store.getState();

        this.province = state.regionsData.map((item) => ({
            label: item.province,
            value: item.province,
        }));

        this.cities = locationTransformer.getAllCityOptions(state.regionsData);
        this.districts = locationTransformer.getAllDistrictOptions(state.regionsData);
        this.fetchSegments();
        this.fetchAtms();
        this.fetchSummary();
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
        this.selectAtmsBox = this.$("#atms-search");
        this.dateSelectBox = this.$("select-box-date");
    }

    async fetchSummary(region, city, province, segmentId, atmId) {
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
        if (atmId) {
            queryString.append("atmId", atmId);
        }
        // for test to get data
        queryString.append("startDate", "2025-06-27");
        queryString.append("startDate", "2025-08-11");

        try {
            this.tableLink = `/analytics/cumulative-summary?${queryString}`;

            this.currentRegion = region;
            this.currentCity = city;
        } catch (err) {
            console.error("❌ Error fetching summary:", err);
        }
    }

    async fetchAtms(region, city, atmId) {
        const queryString = new URLSearchParams();
        if (region) {
            queryString.append("district", region);
        }
        if (city) {
            queryString.append("city", city);
        }
        if (atmId) {
            queryString.append("atmId", atmId);
        }

        try {
            const response = await this.fetchData(`/atm/getatms?${queryString}`);
            this.setState({
                atmsList: response.data.atms.map((atm) => ({
                    value: atm.id,
                    label: atm.name,
                })),
            });
        } catch (err) {
            console.error("❌ Error fetching summary:", err);
            this.setState({
                atmsList: [],
            });
        }
    }

    async fetchSegments() {
        try {
            const response = await this.fetchData("/atm/segments");
            this.setState({
                segments: response.data.map((item) => ({
                    value: item.id,
                    text: item.name,
                })),
            });
        } catch (err) {
            console.error("❌ Error fetching segmentItems:", err);
            this.setState({
                segments: [],
            });
        }
    }

    addEventListeners() {
        this.submitButtonListener();
        this.checkboxesListener();
        this.tabsListener();

        if (this.dateSelectBox) {
            this.addListener(this.dateSelectBox, "date-range-change", (e) => {
                const { startDate, endDate } = e.detail || {};
                if (!startDate || !endDate) return;

                this.setAttribute("start-date", startDate);
                this.setAttribute("end-date", endDate);

                const queryString = this.buildQueryString(startDate, endDate);

                this.tableLink = `/analytics/cumulative-summary?${queryString}`;
                const tableContainer = this.$(".table-container");
                if (tableContainer) {
                    tableContainer.innerHTML = this.renderTable(this.tableLink);
                }
            });
        }
    }

    checkboxesListener() {
        const checkboxes = this.$$("custom-checkbox");
        if (this.activeTab == "") {
            this.activeTab = "province";
        }

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

            this.tableLink = `/analytics/cumulative-summary?${queryString}`;
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
                <div class="container">
                    <simple-table
                        data-source=${link}
                        columns='["province","deposit_amount", "deposit_count", "dispense_amount", "dispense_count", "exchange_eur_amount", "exchange_rub_amount", "exchange_usd_amount"]'>
                    </simple-table>
           
          </div>
        </div>`;
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
        } else if (this.activeTab === "atm") {
            const rawVal = this.selectAtmsBox.getAttribute("value") || "[]";
            JSON.parse(rawVal).forEach((v) => queryString.append("atmIds", String(v)));
        }

        // Add date filters if provided
        if (startDate) queryString.append("startDate", startDate);
        if (endDate) queryString.append("endDate", endDate);

        return queryString;
    }

    template() {
        if (this.state.atmsList.length == 0 || this.state.segments.length == 0) {
            return /*html*/ `
            <div class="row">
                <div class="column sm-12">
                    <div class="loading">
                        <div class="loading__spinner spinner"></div>
                        <div class="loading__text">Տվյալները բեռնվում են…</div>
                    </div>
                </div>
            </div>
            `;
        }

        const atmsList = encode(this.state.atmsList);
        const cities = encode(this.cities);
        const districts = encode(this.districts);
        const segments = encode(this.state.segments);

        return /*html*/ `
           <div class="column">
                <div class="container">
                    <div class="tabs-container">
                        <div class="tabs">
                            <custom-tab name="province" active>Մարզ</custom-tab>
                            <custom-tab name="city">Քաղաք</custom-tab>
                            <custom-tab name="district">Համայնք</custom-tab>
                            <custom-tab name="segment">Սեգմենտ</custom-tab>
                            <custom-tab name="atm">Բանկոմատ</custom-tab>
                        </div>
                           <select-box-date
                                start-date="${this.getAttr("start-date")}"
                                end-date="${this.getAttr("end-date")}"
                            ></select-box-date>
                    </div>
                    <div class="tab-content column sm-6" data-tab="province">
                      <div class="checkboxes">
                            ${this.province
                                .map(
                                    (el) =>
                                        `<custom-checkbox id="${el.value}" value="${el.value}">${el.label}</custom-checkbox>`
                                )
                                .join("")}
                        </div>  
                       <segment-block name='province-segments'></segment-block>
                    </div>
                    <div class="tab-content" data-tab="city" style="display:none">
                        <select-box-search placeholder="Որոնել Քաղաք" options='${cities}' id='city-search'></select-box-search>
                       <segment-block name='city-segments'></segment-block>
                    </div>
                    <div class="tab-content" data-tab="district" style="display:none">
                        <select-box-search placeholder="Որոնել Համայնք" options='${districts}' id='districts-search'></select-box-search>
                       <segment-block name='district-segments'></segment-block>
                    </div>
                    <div class="tab-content" data-tab="segment" style="display:none">
                        <select-box-search placeholder="Որոնել Սեգմենտ" options='${segments}' id='segments-search'></select-box-search>
                    </div>

                       <div class="tab-content" data-tab="atm" style="display:none">
                        <select-box-search placeholder="Որոնել ըստ բանկոմատի ID-ի կամ հասցեի" options='${atmsList}' id='atms-search'></select-box-search>
                    </div>
                    <div class="column sm-3">
                        <button type="submit" class="btn_blue btn_md">Հաստատել</button>
                    </div>
                </div>
      
                    <div class="table-container"></div>
        </div>

        `;
    }
}

customElements.define("cumulative-analythics", Cumulative);
