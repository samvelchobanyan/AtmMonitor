import { DynamicElement } from "../core/dynamic-element.js";
import "../components/dynamic/chartComponent.js";
import "../components/dynamic/infoCard.js";
import "../components/ui/customTab.js";
import "../components/ui/customRadio.js";
import "../components/dynamic/doughnutChart.js";
import "../components/dynamic/select-box-search.js";
import "../components/dynamic/list-view.js";

class journal extends DynamicElement {
    constructor() {
        super();

        this.state = {
            atmId: null,
        };
    }

    onConnected() {
        // this.fetchSummary();
    }

    async fetchSummary(region, city, atmId) {
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
            const response = await this.fetchData(`/analytics/summary?${queryString}`);
            this.setState({
                selectedRegion: region,
                selectedCity: city,
                summary: response.data,
                atmId: atmId,
            });
        } catch (err) {
            console.error("❌ Error fetching summary:", err);
            this.setState({ summary: null });
        }
    }

    template() {
        return /*html*/ `
            <div class="row">
                <div class="column sm-6">
                    <div class="container">
                    <div class="tabs-container">
                        <div class="tabs">
                            <custom-tab name="geo" >Աշխարհագրական</custom-tab>
                            <custom-tab name="atms" active>Բանկոմատներ</custom-tab>
                        </div>
                    </div>
                    <div class="tab-content" data-tab="geo" style="display: none;">
                        <select-box-search placeholder="Choose your fruit" options='[ {"value":"s","label":"Apple"}, {"value":"banana","label":"Banana"}, {"value":"cherry","label":"Cherry"} ]'> </select-box-search>
                    </div>
                    <div class="tab-content" data-tab="atms" >
                        <list-view
                            searchable
                            search-fields="text"
                            items='[
                                    { "text": "ՍԱՍ Սուպերմարկետ", "value": "sas_supermarket" },
                                    { "text": "Առևտրի կենտրոն", "value": "shopping_mall" },
                                    { "text": "Բենզալցակայաններ", "value": "gas_stations" },
                                    { "text": "Օդանավակայան", "value": "airport" },
                                    { "text": "Հյուրանոցներ", "value": "hotels" },
                                    { "text": "Ռեստորաններ", "value": "restaurants" },
                                    { "text": "Դեղատներ", "value": "pharmacies" }
                                    ]'
                            item-component="badge-item"
                        >
                            <template>
                                <custom-checkbox id="{{value}}" value="{{value}}">{{text}}</custom-checkbox> 
                            </template>
                        </list-view>
                    </div>
                </div>
                </div>
            </div>
        `;
    }
}

customElements.define("journal-page", journal);
