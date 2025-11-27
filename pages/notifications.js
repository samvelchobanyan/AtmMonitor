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

        this.startDate = '2025-09-01';
        this.endDate = '2025-11-14';

        this.province = [];
        this.cities = [];
        this.districts = [];

        this.dateSelectBox = null;

        this.segments = null;

        this.tableActiveTab = "Բոլորը";

        this.deviceTypes = [{ id: 0, type_name: "Բոլորը" }];
    }

    onConnected() {
        console.log('onConnected ===>');
        const state = store.getState();

        this.province = state.regionsData.map((item) => ({
            label: item.province,
            value: item.province,
        }));

        this.cities = locationTransformer.getAllCityOptions(state.regionsData);
        this.districts = locationTransformer.getAllDistrictOptions(state.regionsData);

        if (!this.startDate) {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, "0");
            const day = String(today.getDate()).padStart(2, "0");
            this.startDate = `${year}-${month}-${day}`;
        }

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

            this.fetchSummary();
        }
    }

    async fetchSummary() {
        const queryString = this.buildQueryString();

        try {
            const res = await this.fetchData(`/notifications/summary?${queryString}`);
            console.log('summary ===>', res.data);
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
            this.deviceTypes = [...this.deviceTypes, ...res.data];
            console.log('deviceTypes ===>', this.deviceTypes);
            
            // this.tableActiveTab = res.data[0].type_name;
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
        if (this.selectedCity) queryString.append("city", this.selectedCity);
        if (this.selectedRegion) queryString.append("province", this.selectedRegion);

        return queryString;
    }

    onAfterRender() {
        this.dateSelectBox = this.$("#date-selector");
        console.log('onAfterRender ===>', this.dateSelectBox);
    }

    // addEventListeners() {
    //     this.selectDateListener();
    //     this.tableTabsListener();

    //     this.addEventListener("cell-click", (e) => {
    //         const atmid = e.detail?.cellValue;
    //         if (atmid) {
    //             window.location.href = `atms/${atmid}`;
    //         }
    //     });
    // }

    addGlobalEventListeners() {
        // Date range (delegated) - attach once
        this.addEventListener("date-range-change", (e) => {
            const { startDate, endDate } = e.detail || {};
            if (!startDate || !endDate) return;
            this.startDate = startDate;
            this.endDate = endDate;
            this.fetchSummary();
        });

        // Tabs (delegated) - attach once
        this.addEventListener("click", (e) => {
            const tab = e.target.closest("custom-tab");
            if (!tab) return;
            const selectedTab = tab.getAttribute("name");
            if (this.tableActiveTab === selectedTab) return;
            this.tableActiveTab = selectedTab;
            this.setState({ summary: this.state.summary });
        });

        // Row navigation - attach once
        this.addEventListener("cell-click", (e) => {
            const atmid = e.detail?.cellValue;
            if (atmid) window.location.href = `atms/${atmid}`;
        });

        // Button click from simple-grid (mail_sent_at) - attach once
        this.addEventListener("cell-action", async (e) => {
            const { column, rowData } = e.detail || {};
            if (column !== "mail_sent_at") return;

            console.log('cell-action ===>', e.detail);
            

            const btn = document.activeElement;
            if (btn && btn.tagName === "BUTTON") {
                btn.disabled = true;
                btn.textContent = "Ուղարկվում է…";
            }

            // Get notification id (hidden column is included in rowData)
            const notification_id = rowData?.notification_id;
            if (!notification_id) {
                alert("Չկա ծանուցման ID");
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = "Ուղարկել նամակ";
                }
                return;
            }

            const text = rowData?.message || '';
          
            try {
                await this.fetchData(`/notifications/send-mail`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: {
                        notification_id,
                        text,
                    },
                });
        
                // Keep disabled after success
                if (btn) {
                    btn.disabled = true;
                    btn.textContent = "Ուղարկված է";
                }

            } catch (err) {
                console.error("❌ նամակը չի ուղարկվել:", err);
                alert("Չհաջողվեց ուղարկել նամակը");
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = "Ուղարկել նամակ";
                }
            }


            // if (column === "mail_sent_at") {
            //     console.log("notification_id:", rowData?.notification_id);
            // }
        });
    }

    addEventListeners() {
        // Intentionally left empty; delegated listeners are global and attached once
    }

    // tableTabsListener() {
    //     const tableTabs = this.$$("custom-tab");

    //     tableTabs.forEach((tab) => {
    //         this.addListener(tab, "click", async () => {
    //             const selectedTab = tab.getAttribute("name");

    //             if (this.tableActiveTab === selectedTab) return;

    //             this.tableActiveTab = selectedTab;

    //             this.setState({
    //                 summary: this.state.summary,
    //             });
    //         });
    //     });
    // }

    // selectDateListener() {
    //     if (this.dateSelectBox) {
    //         this.addListener(this.dateSelectBox, "date-range-change", (e) => {
    //             const { startDate, endDate } = e.detail || {};
    //             if (!startDate || !endDate) return;
    //             this.startDate = startDate;
    //             this.endDate = endDate;

    //             this.fetchSummary();
    //         });
    //     }
    // }

    template() {
        console.log('template ===>');
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

        const { device_errors, taken_cards, problematic_transactions } = this.state.summary;

        const found = device_errors.filter((item) => item.device_name == this.tableActiveTab);

        const deviceErrors =
            this.tableActiveTab == "Բոլորը"
                ? encode({ device_errors })
                : encode({
                      device_errors: found,
                  });

        const takenCards = encode({
            taken_cards: taken_cards,
        });

        const problematicTransactions = encode({
            problematic_transactions: problematic_transactions,
        });

        return /*html*/ `
            <div class="column sm-12">
                <div class="container">

                   <div class="select-container">
                            <container-top icon="icon-x-octagon" title="Անսարքություններ" number='${
                                device_errors.length
                            }'> </container-top>
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
                 <simple-grid 
                    serial
                    id='device-errors-table'
                    data='${deviceErrors}' 
                    columns='["atm_id","date","address","fault_type","message","notification_id","mail_sent_at"]'
                    hidden-columns='["notification_id"]'
                    link-columns='{"atm_id": "atms/:id"}' 
                    column-labels='{
                        "atm_id":"Բանկոմատ",
                        "date":"Ամսաթիվ",
                        "address":"Հասցե",
                        "fault_type":"Սարքի տեսակ",
                        "message":"Նկարագրություն",
                        "mail_sent_at":"Նամակ ուղարկված է"
                    }'
                    column-conditions='{
                        "mail_sent_at": [
                            { "field": "row.mail_sent_at", "when": "isNull",  "tag": "button", "class": "btn btn_blue btn_sm", "text": "Ուղարկել նամակ" }
                        ]
                    }'
                    clickable-columns = ${encode(["atm_id"])}
                    >
                 </simple-grid>
                </div>

                <div class="container">
                    <container-top icon="icon-x-octagon" title="Առգրավված քարտեր" number='${
                        taken_cards.length
                    }'> </container-top>
                    <simple-grid
                        serial
                        data='${takenCards}' 
                        columns='["atm_id", "date","address","card_number"]'
                        column-labels='{"atm_id":"Բանկոմատ","date":"Ամսաթիվ","address":"Հասցե", "card_number": "Քարտի համար"}'
                        searchable="false">
                    </simple-grid>
                </div>

                 <div class="container">
                    <container-top icon="icon-x-octagon" title="Խնդրահարույց գործարքներ" number='${
                        problematic_transactions.length
                    }'> </container-top>
                    <simple-grid
                        serial
                        data='${problematicTransactions}' 
                        columns='["atm_id", "date","address","amount", "message", "transaction_id"]'
                        column-labels='{"atm_id":"Բանկոմատ","date":"Ամսաթիվ","address":"Հասցե", 
                        "amount": "Գումար", "message": "Նկարագրություն","transaction_id": "Գործարքի ID"}'
                        searchable="false">
                    </simple-grid>
                </div>
            </div>
      `;
    }
}

customElements.define("notifications-page", Notifications);
