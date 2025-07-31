import { DynamicElement } from "../core/dynamic-element.js";
import "../components/dynamic/chartComponent.js";
import "../components/dynamic/infoCard.js";
import "../components/ui/customTab.js";
import "../components/ui/customRadio.js";
import "../components/dynamic/doughnutChart.js";
import "../components/dynamic/select-box-search.js";

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
            <div class="main-container">
                <div class="row">
                    <div class="column sm-6">
                        <div class="container">
                        <div class="tabs-container">
                            <div class="tabs">
                                <custom-tab name="geo" active>Աշխարհագրական</custom-tab>
                                <custom-tab name="atms">Բանկոմատներ</custom-tab>
                            </div>
                        </div>
                        <div class="tab-content" data-tab="geo">
                            <select-box-search placeholder="Choose your fruit" options='[ {"value":"s","label":"Apple"}, {"value":"banana","label":"Banana"}, {"value":"cherry","label":"Cherry"} ]'> </select-box-search>
                        </div>
                        <div class="tab-content" data-tab="atms" style="display: none;">
                            
                        </div>
                    </div>
                    </div>
                </div>
            </div>    
        `;
    }
}

customElements.define("journal-page", journal);




