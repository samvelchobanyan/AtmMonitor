// old
// import { DynamicElement } from "../core/dynamic-element.js";
// import "../components/dynamic/chartComponent.js";
// import "../components/dynamic/infoCard.js";
// import "../components/ui/customTab.js";
// import "../components/ui/customRadio.js";
// import "../components/dynamic/doughnutChart.js";
// import "../components/dynamic/select-box-search.js";
// import "../components/dynamic/list-view.js";
// import "../components/dynamic/segment.js";

// class journal extends DynamicElement {
//     constructor() {
//         super();
//     }

//     onConnected() {
//         // this.fetchSummary();
//     }

//     async fetchSummary(region, city, searchText, cardnumber, pageNumber) {
//         const queryString = new URLSearchParams();
//         if (region) {
//             queryString.append("district", region);
//         }
//         if (city) {
//             queryString.append("city", city);
//         }
//         if (searchText) {
//             queryString.append("searchTerm", searchText);
//         }
//         if (cardnumber) {
//             queryString.append("cardnumber", cardnumber);
//         }
//         if (pageNumber) {
//             queryString.append("pageNumber", pageNumber);
//         }
//         try {
//             const response = await this.fetchData(`/journal/events-journal?${queryString}`);
//             this.setState({
//                 selectedRegion: region,
//                 selectedCity: city,
//                 summary: response.data,
//                 atmId: atmId,
//             });
//         } catch (err) {
//             console.error("❌ Error fetching summary:", err);
//             this.setState({ summary: null });
//         }
//     }

//     template() {
//         return /*html*/ `
//             <div class="row">
//                 <div class="column sm-6">
//                     <div class="container">
//                     <div class="tabs-container">
//                         <div class="tabs">
//                             <custom-tab name="atms" active >Բանկոմատ</custom-tab>
//                             <custom-tab name="cards">Քարտ</custom-tab>
//                         </div>
//                     </div>
//                     <div class="tab-content" data-tab="geo">
//                         <segment-block></segment-block>
//                     </div>
//                     <div class="tab-content" data-tab="atms" style="display: none">
//                         <list-view
//                             searchable
//                             search-fields="text"
//                             items='[

//                                     { "text": "ՍԱՍ Սուպերմարկետ", "value": "sas_supermarket" },
//                                     { "text": "Առևտրի կենտրոն", "value": "shopping_mall" },
//                                     { "text": "Բենզալցակայաններ", "value": "gas_stations" },
//                                     { "text": "Օդանավակայան", "value": "airport" },
//                                     { "text": "Հյուրանոցներ", "value": "hotels" },
//                                     { "text": "Ռեստորաններ", "value": "restaurants" },
//                                     { "text": "Դեղատներ", "value": "pharmacies" }
//                                     ]'
//                             item-component="badge-item"
//                         >
//                             <template>
//                                 <custom-checkbox id="{{value}}" value="{{value}}">{{text}}</custom-checkbox>
//                             </template>
//                         </list-view>
//                     </div>
//                 </div>
//                 </div>
//             </div>
//         `;
//     }
// }

// customElements.define("journal-page", journal);

import { DynamicElement } from "../core/dynamic-element.js";
import "../components/dynamic/list-view.js";

class JournalPage extends DynamicElement {
    constructor() {
        super();
        this.state = {
            summary: [],
        };
    }

    async onConnected() {
        this.fetchSummary();
    }

    async fetchSummary(region, city, searchText, cardnumber, pageNumber) {
        const queryString = new URLSearchParams();
        if (region) queryString.append("district", region);
        if (city) queryString.append("city", city);
        if (searchText) queryString.append("searchTerm", searchText);
        if (cardnumber) queryString.append("cardnumber", cardnumber);
        if (pageNumber) queryString.append("pageNumber", pageNumber);

        try {
            const response = await this.fetchData(`/journal/events-journal?${queryString}`);
            this.setState({ summary: response.data });

            // console.log("resopnse", response);
        } catch (err) {
            console.error("❌ Error fetching summary:", err);
            this.setState({ summary: [] });
        }
    }

    template() {
        if (this.state.summary.events === undefined) return;

        // console.log(this.state.summary.events);
        let itemsData = JSON.stringify(this.state.summary.events).replace(/"/g, "&quot;");
        return /*html*/ `
            <div class="row">
                <div class="column sm-12">
                    <div class="container">
                        <list-view
                            id="journal"
                            searchable
                            search-fields="date,server_date,event_description,card_number,code"
                            items="${itemsData}"
                            item-component="badge-item"
                        >
                            <template>
                             <custom-checkbox id="{{value}}" value="{{value}}">{{text}}</custom-checkbox>
                            </template>
                        </list-view>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define("journal-page", JournalPage);
