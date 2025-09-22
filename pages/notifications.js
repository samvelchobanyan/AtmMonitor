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

class Notifications extends DynamicElement {
    constructor() {
        super();
        this.state = {
            summary: null,
        };

        this.selectedCity = null;
        this.selectedRegion = null;

        this.startDate = null;
        this.endDate = null;

        this.province = [];
        this.cities = [];
        this.districts = [];

        this.dateSelectBox = null;

        this.segments = null;

        this.tableActiveTab = null;
        this.tableLink = "/device-faults/summary";

        this.deviceTypes = [];
    }

    onConnected() {
        console.log("connected");

        const state = store.getState();

        this.province = state.regionsData.map((item) => ({
            label: item.province,
            value: item.province,
        }));

        this.cities = locationTransformer.getAllCityOptions(state.regionsData);
        this.districts = locationTransformer.getAllDistrictOptions(state.regionsData);
        // this.fetchTopSummary();
        this.fetchSummary();
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

    async fetchSummary() {
        const queryString = this.buildQueryString();

        try {
            const res = await this.fetchData(`/notifications/summary?${queryString}`);

            this.setState({
                summary: res.data,
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
            this.tableActiveTab = res.data[0].type_name;
        } catch (err) {
            console.error("❌ Failed to init table tabs:", err);
        }
    }

    buildQueryString() {
        const queryString = new URLSearchParams();
        // for test
        queryString.append("userId", "1");

        if (this.startDate) queryString.append("startDate", this.startDate);
        if (this.endDate) queryString.append("endDate", this.endDate);
        if (this.tableActiveTab) queryString.append("deviceId", this.tableActiveTab);

        return queryString;
    }

    onAfterRender() {
        this.dateSelectBox = this.$("#date-selector");
    }

    addEventListeners() {
        this.selectDateListener();
        this.tableTabsListener();
    }

    tableTabsListener() {
        const tableTabs = this.$$("custom-tab");

        tableTabs.forEach((tab) => {
            this.addListener(tab, "click", async () => {
                const selectedTab = tab.getAttribute("name");

                if (this.tableActiveTab === selectedTab) return;

                this.tableActiveTab = selectedTab;
                // this.fetchSummary();

                this.setState({
                    summary: this.state.summary,
                });
            });
        });
    }

    selectDateListener() {
        if (this.dateSelectBox) {
            this.addListener(this.dateSelectBox, "date-range-change", (e) => {
                const { startDate, endDate } = e.detail || {};
                if (!startDate || !endDate) return;
                this.startDate = startDate;
                this.endDate = endDate;

                this.fetchSummary();
            });
        }
    }

    template() {
        console.log("template");

        if (!this.state.summary) {
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

        console.log("summary", this.state.summary);
        const found1 = this.state.summary.device_errors.filter(
            (item) => item.device_name == this.tableActiveTab
        );

        const found2 = this.state.summary.device_errors.filter(
            (item) => item.device_name == this.tableActiveTab
        );
        console.log("this.tableActiveTab", this.tableActiveTab);

        // console.log("found", found);

        const deviceErrors = encode({
            device_errors: found1,
        });

        const takenCards = encode({
            taken_cards: found2,
        });

        // todo ask aram where is total count in second table

        return /*html*/ `
            <div class="column sm-12">
                <div class="container">

                   <div class="select-container">
                            <container-top icon="icon-x-octagon" title="Անսարքություններ"> </container-top>
                             <select-box-date
                                start-date="${this.startDate ? this.startDate : ""}"
                                end-date="${this.endDate ? this.endDate : ""}"
                                id='date-selector'
                            ></select-box-date>
                         </div>  
                        
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
                 <simple-table
                    data='${deviceErrors}' 
                    columns='["date","atm_and_address","fault_type"]'>
                 </simple-table>
                </div>

                <div class="container">
                    <container-top icon="icon-x-octagon" title="Առգրավված քարտեր"> </container-top>
                    <simple-table
                        data='${takenCards}' 
                        columns='["date","atm_and_address","fault_type"]'>
                    </simple-table>
                </div>
            </div>
      `;
    }
}

customElements.define("notifications-page", Notifications);
