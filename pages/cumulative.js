import { DynamicElement } from "../core/dynamic-element.js";
import locationTransformer from "../core/utils/location-transformer.js";
import { store } from "../core/store/store.js";
import "../components/dynamic/doughnutTabs.js";
import "../components/ui/customTab.js";
import "../components/dynamic/select-box-search.js";
import "../components/ui/customCheck.js";
import "../components/dynamic/segment.js";
import "../components/dynamic/simpleTable.js";

class Cumulative extends DynamicElement {
    constructor() {
        super();

        this.state = {
            summary: null,
            link: "/analytics/cumulative-summary",
        };

        this.province = [];
        this.cities = [];
        this.districts = [];

        this.currentRegion = null;

        this.currentCity = null;

        this.atmsList = [];
        this.segments = [];

        this.activeTab = "";
        this.checkedValues = new Set();
        this.actualValue = "";

        this.submitButton = null;
        this.selectCityBox = null;
        this.selectDistrictBox = null;
        this.selectSegmentBox = null;
        this.selectAtmsBox = null;
    }

    // todo: design fix
    // todo: does header locations should be here?

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
        this.submitButton = this.$(".btn_blue");
        this.selectCityBox = this.$("#city-search");
        this.selectDistrictBox = this.$("#districts-search");
        this.selectSegmentBox = this.$("#segments-search");
        this.selectAtmsBox = this.$("#atms-search");

        // to avoid reset of activet tab

        if (this.activeTab && this.activeTab.trim() !== "") {
            const matchingTab = this.$(`custom-tab[name="${this.activeTab}"]`);

            if (matchingTab) {
                // Remove active from all tabs
                this.$$("custom-tab").forEach((t) => t.removeAttribute("active"));
                // Set active to the matching one
                matchingTab.setAttribute("active", "");
                // Optionally show correct content and hide others
                this.showTabContent(this.activeTab);
            }
        }

        if (this.activeTab && this.actualValue != "") {
            const matchingTab = this.$(`custom-tab[name="${this.activeTab}"]`);
            if (matchingTab) {
                // Remove active from all tabs
                // this.$$("custom-tab").forEach((t) => t.removeAttribute("active"));
                // Set active to the matching one
                matchingTab.setAttribute("value", "");
                // Optionally show correct content and hide others
                this.showTabContent(this.activeTab);
            }
        }

        console.log(" this.actualValue ", this.actualValue);
    }
    showTabContent(tabName) {
        this.$$(".tab-content").forEach((content) => {
            if (content.dataset.tab === tabName) {
                content.style.display = "";
            } else {
                content.style.display = "none";
            }

            
        });
    }
    onStoreChange(storeState) {
        const region = storeState.selectedRegion;
        const city = storeState.selectedCity;
        if (region !== this.currentRegion || city !== this.currentCity) {
            this.fetchSummary(region, city);
        }
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
            const response = await this.fetchData(`/analytics/cumulative-summary?${queryString}`);
            this.setState({
                link: `/analytics/cumulative-summary?${queryString}`,
            });

            this.currentRegion = region;
            this.currentCity = city;
            console.log(response);

            this.setState({
                summary: response.data,
            });
        } catch (err) {
            console.error("❌ Error fetching summary:", err);
            this.setState({
                summary: null,
            });
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
            this.atmsList = response.data.atms.map((atm) => ({
                value: atm.id,
                label: atm.name,
            }));
        } catch (err) {
            console.error("❌ Error fetching summary:", err);
            this.atmsList = [];
        }
    }
    async fetchSegments() {
        try {
            const response = await this.fetchData("/atm/segments");

            this.segments = response.data.map((item) => ({
                value: item.id,
                text: item.name,
            }));
        } catch (err) {
            console.error("❌ Error fetching segmentItems:", err);
            this.segments = [];
        }
    }
    addEventListeners() {
        this.submitButtonListener();
        this.checkboxesListener();
        this.tabsListener();
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
                    this.checkedValues.add(val); // Add without clearing
                } else {
                    this.checkedValues.delete(val); // Remove if unchecked
                }
            });

            // Restore state if needed
            if (this.checkedValues.has(val)) {
                checkbox.setAttribute("checked", "");
                const input = checkbox.querySelector('input[type="checkbox"]');
                if (input) input.checked = true;
            }
        });
    }

    submitButtonListener() {
        if (this.submitButton) {
            this.addListener(this.submitButton, "click", () => {
                const queryString = new URLSearchParams();

                console.log("this.activeTab", this.activeTab);

                if (this.activeTab == "province") {
                    const checkedValues = Array.from(this.checkedValues);
                    console.log("!!checkedValues", checkedValues);
                    this.actualValue = checkedValues;
                    if (checkedValues) {
                        checkedValues.forEach((v) => queryString.append("provinces", v));
                    }
                } else if (this.activeTab == "city") {
                    // const searchValues = this.selectCityBox.getAttribute("value");
                    // queryString.append("city", searchValues);

                    const searchValues = this.selectCityBox.getAttribute("value")?.split(",") || [];
                    this.actualValue = searchValues;
                    searchValues.forEach((v) => queryString.append("cities", v));
                } else if (this.activeTab == "district") {
                    // const searchValues = this.selectDistrictBox.getAttribute("value");

                    // if (searchValues[0]) {
                    // queryString.append("district", searchValues);
                    // }

                    const searchValues =
                        this.selectDistrictBox.getAttribute("value")?.split(",") || [];
                    searchValues.forEach((v) => queryString.append("districts", v));
                } else if (this.activeTab == "segment") {
                    // const searchValues = this.selectSegmentBox.getAttribute("value");
                    // console.log("searchValues", searchValues);
                    // if (searchValues[0]) {
                    //     queryString.append("segmentId", searchValues);
                    // }
                    const searchValues =
                        this.selectSegmentBox.getAttribute("value")?.split(",") || [];
                    console.log(searchValues);

                    searchValues.forEach((v) => queryString.append("segmentIds", v));
                }

                // for test to get data
                queryString.append("startDate", "2025-06-27");
                queryString.append("startDate", "2025-08-11");
                this.setState({
                    link: `/analytics/cumulative-summary?${queryString}`,
                });
            });
        }
    }

    tabsListener() {
        const tabs = this.$$("custom-tab");

        tabs.forEach((tab) => {
            this.addListener(tab, "click", () => {
                const selectedTabName = tab.getAttribute("name");
                console.log("Selected tab:", selectedTabName);

                // Store active tab so submitButtonListener knows which one is active
                this.activeTab = selectedTabName;

                // Reset other tab values but DON'T change this.state.link yet
                // this.resetTabValues(selectedTabName);
            });
        });
    }
    template() {
        if (!this.state.summary || !this.atmsList || !this.segments) {
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

        const atmsList = JSON.stringify(this.atmsList).replace(/"/g, "&quot;");
        const cities = JSON.stringify(this.cities).replace(/"/g, "&quot;");
        const districts = JSON.stringify(this.districts).replace(/"/g, "&quot;");
        const segments = JSON.stringify(this.segments).replace(/"/g, "&quot;");

        return /*html*/ `

            
        <div class="row">
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
                        <div class="row"> <segment-block></segment-block></div>
                    </div>
                    <div class="tab-content" data-tab="city" style="display:none">
                        <select-box-search placeholder="Որոնել Քաղաք" options='${cities}' id='city-search'></select-box-search>
                        <div class="row"> <segment-block></segment-block></div>
                    </div>
                    <div class="tab-content" data-tab="district" style="display:none">
                        <select-box-search placeholder="Որոնել Համայնք" options='${districts}' id='districts-search'></select-box-search>
                        <div class="row"> <segment-block></segment-block></div>
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

            </div>

           
        </div>

        <div class="row">
           <div class="column">
                <div class="container">
                    <simple-table
                        data-source=${this.state.link}
                        columns='["province","deposit_amount", "deposit_count", "dispense_amount", "dispense_count", "exchange_eur_amount", "exchange_rub_amount", "exchange_usd_amount"]'
                    </simple-table>
                </div>
            </div>
          </div>
        </div>
            
        `;
    }
}

customElements.define("cumulative-analythics", Cumulative);
