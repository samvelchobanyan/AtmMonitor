import "./doughnutTabs.js";
import "../ui/customTab.js";
import "./select-box-search.js";
import "../ui/customCheck.js";
import "./segment.js";
import "./simpleTable.js";
import "./select-box-date.js";
import encode from "../../assets/js/utils/encode.js";
import { store } from "../../core/store/store.js";
import locationTransformer from "../../core/utils/location-transformer.js";
import { DynamicElement } from "../../core/dynamic-element.js";

class FiltrationTabs extends DynamicElement {
    constructor() {
        super();
        this.state = {
            atmsList: [],
        };

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

        this.startDate = null;
        this.endDate = null;

        this.showAtm = true;

        this.segments = null;
    }

    onConnected() {
        const state = store.getState();

        this.province = state.regionsData.map((item) => ({
            label: item.province,
            value: item.province,
        }));
        if (this.getAttribute("show-atm") == false) {
            this.showAtm = false;
        }

        this.cities = locationTransformer.getAllCityOptions(state.regionsData);
        this.districts = locationTransformer.getAllDistrictOptions(state.regionsData);
        if (this.showAtm) this.fetchAtms();
    }

    onStoreChange(storeState) {
        this.segments = storeState.segments.map((item) => ({
            value: item.id,
            text: item.name,
        }));
    }

    onAfterRender() {
        this.submitButton = this.$(".btn_blue");
        this.selectCityBox = this.$("#city-search");
        this.selectDistrictBox = this.$("#districts-search");
        this.selectSegmentBox = this.$("#segments-search");
        if (this.showAtm) this.selectAtmsBox = this.$("#atms-search");
        this.dateSelectBox = this.$("select-box-date");
    }

    getSubmitButton() {
        return this.$("#submit_button");
    }

    async fetchAtms() {
        try {
            const response = await this.fetchData(`/atm/getatms`);
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

    addEventListeners() {
        this.submitButtonListener();
        this.checkboxesListener();
        this.tabsListener();

        if (this.dateSelectBox) {
            this.addListener(this.dateSelectBox, "date-range-change", (e) => {
                const { startDate, endDate } = e.detail || {};
                if (!startDate || !endDate) return;
                this.startDate = startDate;
                this.endDate = endDate;
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
            const queryString = this.buildQueryString();
            this.dispatchEvent(
                new CustomEvent("filter-submit", {
                    detail: { query: queryString?.toString() },
                    bubbles: true,
                })
            );
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

    buildQueryString() {
        const queryString = new URLSearchParams();

        // Add tab-specific filters
        if (this.activeTab === "province") {
            const checkedValues = Array.from(this.checkedValues);
            const segments = this.querySelector("segment-block[name='province-segments']");
            checkedValues.forEach((v) => queryString.append("provinces", v));
            if (segments?.values?.length)
                segments.values.forEach((v) => queryString.append("segmentIds", v));
        } else if (this.activeTab === "city") {
            const rawValue = this.selectCityBox.getAttribute("value") || [];
            let values = JSON.parse(rawValue);
            if (values.length == 0) return;
            values.forEach((v) => queryString.append("cities", v));

            const segments = this.querySelector("segment-block[name='city-segments']");
            if (segments?.values?.length)
                segments.values.forEach((v) => queryString.append("segmentIds", v));
        } else if (this.activeTab === "district") {
            const rawValue = this.selectDistrictBox.getAttribute("value") || [];
            let values = JSON.parse(rawValue);
            if (values.length == 0) return;
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

        if (this.startDate) queryString.append("startDate", this.startDate);
        if (this.endDate) queryString.append("endDate", this.endDate);

        return queryString;
    }

    template() {
        if (this.state.atmsList.length == 0) {
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
                              ${
                                  this.getAttribute("showAtm")
                                      ? `<custom-tab name="atm">Բանկոմատ</custom-tab>`
                                      : ""
                              }
                        </div>
                           <select-box-date></select-box-date>
                    </div>
                        <div class="tab-content" data-tab="province">
                         <div class="checkboxes">
                            ${this.province
                                .map(
                                    (el) =>
                                        `<custom-checkbox id="${el.value}" value="${el.value}">${el.label}</custom-checkbox>`
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
                ${
                    this.getAttribute("showAtm")
                        ? `<div class="tab-content" data-tab="atm" style="display:none">
                               <select-box-search placeholder="Որոնել ըստ բանկոմատի ID-ի կամ հասցեի" options='${atmsList}' id='atms-search'></select-box-search>
                           </div>`
                        : ""
                }
                    <div class="btn-container btn-container_decor">
                        <button type="submit" class="btn btn_fit btn_blue btn_md" id='submit_button'>Հաստատել</button>
                    </div>
                    </div>
                </div>
            </div>
          
        `;
    }
}

customElements.define("filtration-tabs", FiltrationTabs);
