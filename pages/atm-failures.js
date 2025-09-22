import { DynamicElement } from "../core/dynamic-element.js";
import "../components/dynamic/chartComponent.js";
import "../components/dynamic/infoCard.js";
import "../components/ui/customTab.js";
import "../components/dynamic/simpleTable.js";
import "../components/dynamic/select-box.js";
import "../components/dynamic/select-box-date.js";
import "../components/ui/customTab.js";
import "../components/dynamic/select-box-search.js";
import "../components/ui/customCheck.js";
import "../components/dynamic/segment.js";
import { store } from "../core/store/store.js";
import locationTransformer from "../core/utils/location-transformer.js";
import encode from "../assets/js/utils/encode.js";

class AtmFailures extends DynamicElement {
    constructor() {
        super();
        this.state = {
            topSummary: null,
            devicesTypeSummary: null,
            chartData: null,
        };

        this.selectedCity = null;
        this.selectedRegion = null;

        this.topStartDate = null;
        this.topEndDate = null;

        this.bottomStartDate = null;
        this.bottomEndDate = null;

        this.province = [];
        this.cities = [];
        this.districts = [];
        this.locationActiveTab = "province";

        this.checkedValues = new Set();
        this.submitButton = null;
        this.selectCityBox = null;
        this.selectDistrictBox = null;
        this.selectSegmentBox = null;
        this.topDateSelectBox = null;
        this.bottomDateSelectBox = null;

        this.segments = null;

        this.tableActiveTab = null;
        this.tableLink = "/device-faults/summary";

        this.deviceTypes = [];
    }

    onConnected() {
        const state = store.getState();

        this.province = state.regionsData.map((item) => ({
            label: item.province,
            value: item.province,
        }));

        this.cities = locationTransformer.getAllCityOptions(state.regionsData);
        this.districts = locationTransformer.getAllDistrictOptions(state.regionsData);
        this.fetchTopSummary();
        this.fetchChartSummary();
        this.initTableTabs();
    }

    onStoreChange(storeState) {
        this.segments = storeState.segments.map((item) => ({
            value: item.id,
            text: item.name,
        }));

        const region = storeState.selectedRegion;
        const city = storeState.selectedCity;

        if (region !== this.selectedRegion || city !== this.selectedCity) {
            this.selectedRegion = region;
            this.selectedCity = city;
        }
    }

    async fetchTopSummary() {
        const queryString = new URLSearchParams();
        if (this.topStartDate) queryString.append("startDate", this.topStartDate);
        if (this.topEndDate) queryString.append("endDate", this.topEndDate);

        try {
            const response = await this.fetchData(`/device-faults/summary?${queryString}`);
            this.setState({
                topSummary: response.data.top_faulting_atms,
            });
        } catch (err) {
            console.error("❌ Error fetching summary:", err);
            this.setState({ summary: null });
        }
    }

    async fetchChartSummary() {
        const queryString = this.buildBottomQueryString();

        try {
            const chartResponse = await this.fetchData(`/device-faults/summary?${queryString}`);
            const tableResponse = await this.fetchData(
                `/device-faults/by-device-type?${queryString}`
            );

            this.setState({
                devicesTypeSummary: tableResponse.data,
                chartData: chartResponse.data.faults_by_device_type,
            });
        } catch (err) {
            console.error("❌ Error fetching summary:", err);
            this.setState({ summary: null });
        }
    }

    async initTableTabs() {
        try {
            const res = await this.fetchData(`/device-faults/all-device-types`);
            this.deviceTypes = res.data;
            this.tableActiveTab = res.data[0].id;
        } catch (err) {
            console.error("❌ Failed to init table tabs:", err);
        }
    }

    submitButtonListener() {
        if (!this.submitButton) return;

        this.addListener(this.submitButton, "click", () => {
            this.fetchChartSummary();
        });
    }

    tabsListener() {
        const tabs = this.$$(".filter_tabs custom-tab");
        tabs.forEach((tab) => {
            this.addListener(tab, "click", () => {
                const selectedTabName = tab.getAttribute("name");
                // Store active tab so submitButtonListener knows which one is active
                this.locationActiveTab = selectedTabName;
            });
        });
    }

    buildBottomQueryString() {
        const queryString = new URLSearchParams();

        // Add tab-specific filters
        if (this.locationActiveTab === "province") {
            const checkedValues = Array.from(this.checkedValues);
            const segments = this.querySelector("segment-block[name='province-segments']");
            checkedValues.forEach((v) => queryString.append("provinces", v));
            if (segments?.values?.length)
                segments.values.forEach((v) => queryString.append("segmentIds", v));
        } else if (this.locationActiveTab === "city") {
            const values = this.selectCityBox.getAttribute("value")?.split(",") || [];
            values.forEach((v) => queryString.append("cities", v));
            const segments = this.querySelector("segment-block[name='city-segments']");
            if (segments?.values?.length)
                segments.values.forEach((v) => queryString.append("segmentIds", v));
        } else if (this.locationActiveTab === "district") {
            const values = this.selectDistrictBox.getAttribute("value")?.split(",") || [];
            values.forEach((v) => queryString.append("districts", v));
            const segments = this.querySelector("segment-block[name='district-segments']");
            if (segments?.values?.length)
                segments.values.forEach((v) => queryString.append("segmentIds", v));
        } else if (this.locationActiveTab === "segment") {
            const rawVal = this.selectSegmentBox.getAttribute("value") || "[]";
            JSON.parse(rawVal).forEach((v) => queryString.append("segmentIds", Number(v)));
        }
        // Add date filters if provided
        if (this.bottomStartDate) queryString.append("startDate", this.bottomStartDate);
        if (this.bottomEndDate) queryString.append("endDate", this.bottomEndDate);
        if (this.tableActiveTab) queryString.append("deviceId", this.tableActiveTab);

        return queryString;
    }

    onAfterRender() {
        this.submitButton = this.$(".btn_blue");
        this.selectCityBox = this.$("#city-search");
        this.selectDistrictBox = this.$("#districts-search");
        this.selectSegmentBox = this.$("#segments-search");
        this.topDateSelectBox = this.$("#top-date");
        this.bottomDateSelectBox = this.$("#bottom-date");
        this.tabsListener();
    }

    buildQuery(startDate, endDate) {
        const queryString = new URLSearchParams();

        if (this.selectedRegion) queryString.append("district", this.selectedRegion);
        if (this.selectedCity) queryString.append("city", this.selectedCity);
        if (startDate) queryString.append("startDate", startDate);
        if (endDate) queryString.append("endDate", endDate);

        return `/device-faults/summary?${queryString.toString()}`;
    }

    addEventListeners() {
        this.submitButtonListener();
        this.checkboxesListener();
        this.selectDatesListener();
        this.tableTabsListener();
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

    tableTabsListener() {
        const tableTabs = this.$$(".table_tabs custom-tab");

        tableTabs.forEach((tab) => {
            this.addListener(tab, "click", async () => {
                const selectedTab = tab.getAttribute("name");

                if (this.tableActiveTab === selectedTab) return;

                this.tableActiveTab = selectedTab;
                this.fetchChartSummary();
            });
        });
    }

    selectDatesListener() {
        if (this.topDateSelectBox) {
            this.addListener(this.topDateSelectBox, "date-range-change", (e) => {
                const { startDate, endDate } = e.detail || {};
                if (!startDate || !endDate) return;
                this.topStartDate = startDate;
                this.topEndDate = endDate;

                this.fetchTopSummary();
            });
        }

        if (this.bottomDateSelectBox) {
            this.addListener(this.bottomDateSelectBox, "date-range-change", (e) => {
                const { startDate, endDate } = e.detail || {};
                if (!startDate || !endDate) return;
                this.bottomStartDate = startDate;
                this.bottomEndDate = endDate;

                this.fetchChartSummary();
            });
        }
    }

    template() {
        const cities = encode(this.cities);
        const districts = encode(this.districts);
        const segments = encode(this.segments);

        const topFailures = encode({
            top_faulting_atms: this.state.topSummary,
        });

        if (
            !this.state.topSummary ||
            !this.state.devicesTypeSummary ||
            this.deviceTypes.length == 0
        ) {
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

        //send correct data to the table according to chosen tab of device type
        const found = this.state.devicesTypeSummary.find(
            (item) => item.device_type_id == this.tableActiveTab
        );

        const faultsByDevice = encode({
            faults_by_device_type: found?.atms,
        });
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
                        
                    <div class="container">
                        <simple-table
                          data='${topFailures}'
                          columns='["atm_and_address", "total_faults_count", "faults_summary"]'
                          searchable="false">
                        </simple-table>
                    </div>  
                    </div>
                  </div>

              <div class="column sm-12">
                <div class="container">
                    <div class="tabs-container">
                        <div class="tabs filter_tabs">
                            <custom-tab name="province" active>Մարզ</custom-tab>
                            <custom-tab name="city">Քաղաք</custom-tab>
                            <custom-tab name="district">Համայնք</custom-tab>
                            <custom-tab name="segment">Սեգմենտ</custom-tab>
                        </div>
                        <select-box-date
                            start-date="${this.getAttr("start-date")}"
                            end-date="${this.getAttr("end-date")}"
                            id='bottom-date'
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
            
            <div class="column sm-12">
                <div class="container">
                  <div class="tabs table_tabs">
                    ${this.deviceTypes
                        .map(
                            (type) =>
                                `<custom-tab name="${type.id}" ${
                                    type.id == this.tableActiveTab ? "active" : ""
                                }>${type.type_name}</custom-tab>`
                        )
                        .join("")}
                 </div>
                 <simple-table
                    data='${faultsByDevice}'
                    columns='["atm_and_address", "total_faults", "faults_duration"]'>
                 </simple-table>
                </div>
            </div>
      </div>
      `;
    }
}

// <doughnut-chart id="failures-amount" data='${amountData}'></doughnut-chart>

customElements.define("atm-failures", AtmFailures);
