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
        };

        this.province = [];
        this.cities = [];
        this.districts = [];

        this.currentRegion = null;
        this.currentCity = null;

        this.atmsList = [];
        this.segments = [];

        // this.selectCityBox1 = null;
        // this.selectCityBox2 = null;
        // this.selectRegionBox1 = null;
        // this.selectRegionBox2 = null;
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

        this.fetchSummary();
        if (this.segments.length == 0) {
            this.fetchSegments();
        }
        if (this.atmsList.length == 0) {
            this.fetchAtms();
        }
    }

    // onAfterRender() {
    //     this.selectCityBox1 = this.$("#city-selector1");
    //     this.selectCityBox2 = this.$("#city-selector2");
    //     this.selectRegionBox1 = this.$("#province-selector1");
    //     this.selectRegionBox2 = this.$("#province-selector2");
    // }

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
        if (this.selectCityBox1) {
            this.addListener(this.selectCityBox1, "change", (e) => {
                this.currentCity1 = e.target.value;
                this.fetchFirstSummary(this.currentRegion1, this.currentCity1);
            });
        }

        if (this.selectCityBox2) {
            this.addListener(this.selectCityBox2, "change", (e) => {
                this.currentCity2 = e.target.value;
                this.fetchSecondSummary(this.currentRegion2, this.currentCity2);
            });
        }
    }

    template() {
        // const firstSummary = this.state.firstSummary;
        // const secondSummary = this.state.secondSummary;
        console.log("1", this.state.summary);
        console.log(this.atmsList);
        console.log(this.segments);

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

        console.log("this.segments", this.segments);

        return /*html*/ `

            
        <div class="row">
           <div class="column">
                <div class="container">
                    <div class="tabs-container">
                        <div class="tabs">
                            <custom-tab name="region" active>Մարզ</custom-tab>
                            <custom-tab name="city">Քաղաք</custom-tab>
                            <custom-tab name="province">Համայնք</custom-tab>
                            <custom-tab name="segment">Սեգմենտ</custom-tab>
                            <custom-tab name="atm">Բանկոմատ</custom-tab>
                        </div>
                    </div>
                    <div class="tab-content column sm-6" data-tab="region">
                      <div class="checkboxes">
                            ${this.province
                                .map(
                                    (el) =>
                                        `<custom-checkbox id="${el.value}" value="${el.value}" checked>${el.label}</custom-checkbox>`
                                )
                                .join("")}
                        </div>  
                        <div class="row"> <segment-block></segment-block></div>
                    </div>
                    <div class="tab-content" data-tab="city" style="display:none">
                        <select-box-search placeholder="Որոնել Քաղաք" options='${cities}'></select-box-search>
                        <div class="row"> <segment-block></segment-block></div>
                    </div>
                    <div class="tab-content" data-tab="province" style="display:none">
                        <select-box-search placeholder="Որոնել Համայնք" options='${districts}'></select-box-search>
                        <div class="row"> <segment-block></segment-block></div>
                    </div>
                    <div class="tab-content" data-tab="segment" style="display:none">
                        <select-box-search placeholder="Որոնել Սեգմենտ" options='${segments}'></select-box-search>
                    </div>

                       <div class="tab-content" data-tab="atm" style="display:none">
                        <select-box-search placeholder="Որոնել ըստ բանկոմատի ID-ի կամ հասցեի" options='${atmsList}'></select-box-search>
                    </div>
                </div>
            </div>

           
        </div>

                         <simple-table
                            data-source="/analytics/cumulative-summary?startDate=2025-06-01"
                            columns='["province","deposit_amount", "deposit_count", "dispense_amount", "dispense_count", "exchange_eur_amount", "exchange_rub_amount", "exchange_usd_amount"]'
                        </simple-table>
          </div>
            
        `;
    }
}

customElements.define("cumulative-analythics", Cumulative);
