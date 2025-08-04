import { DynamicElement } from "../core/dynamic-element.js";
import { ContainerTop } from "../components/ui/containerTop.js";
import "../components/dynamic/doughnutTabs.js";

class inOut extends DynamicElement {
    constructor() {
        super();

        this.state = {
            summary: null,
            atmId: null,
        };

        this.currentRegion = null;
        this.currentCity = null;
    }

    onConnected() {
        this.fetchSummary();
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
            this.currentRegion = region;
            this.currentCity = city;
            this.setState({
                summary: response,
                atmId: atmId,
            });
        } catch (err) {
            console.error("❌ Error fetching summary:", err);
            this.setState({ summary: null });
        }
    }
    onStoreChange(storeState) {
        const region = storeState.selectedRegion;
        const city = storeState.selectedCity;
        if (region !== this.currentRegion || city !== this.currentCity) {
            this.fetchSummary(region, city);
        }
    }


    template() {
        const summary = this.state.summary;
        if (!summary) {
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

        const dispenseData = JSON.stringify(summary.data.dispense_summary).replace(/"/g, '&quot;');
        const depositData = JSON.stringify(summary.data.deposit_summary).replace(/"/g, '&quot;');

        return /*html*/ `
        <div class="row">
          <div class="column sm-6">
            <div class="container">
              <doughnut-tabs id="dispense" data="${dispenseData}"></doughnut-tabs>
            </div>
          </div>
          <div class="column sm-6">
            <div class="container">
             <doughnut-tabs id="deposit" data="${depositData}"></doughnut-tabs>
            </div>
          </div>
        </div>
        `;
    }
}

customElements.define("in-out", inOut);




