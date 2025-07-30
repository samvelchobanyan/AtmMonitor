import { DynamicElement } from "../core/dynamic-element.js";
import "../components/dynamic/chartComponent.js";
import "../components/static/infoCard.js";
import "../components/ui/customTab.js";
import "../components/ui/customRadio.js";
import "../components/dynamic/doughnutChart.js";

class inOut extends DynamicElement {
    constructor() {
        super();

        this.state = {
            selectedRegion: null,
            selectedCity: null,
            summary: null,
            atmId: null,
        };
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
    onStoreChange(storeState) {
        const region = storeState.selectedRegion;
        const city = storeState.selectedCity;
        if (region !== this.state.selectedRegion || city !== this.state.selectedCity) {
            this.fetchSummary(region, city); // one API call → one render
        }
    }

    template() {
        if (!this.state.summary) {
            return /*html*/ `
            <div class="main-container">
                <div class="row">
                    <div class="column sm-12">
                        <div class="loading">
                            <div class="loading__spinner spinner"></div>
                            <div class="loading__text">Տվյալները բեռնվում են…</div>
                        </div>
                    </div>
                </div>
            </div>
            `;
        }

        const dispenseSummary = this.state.summary.dispense_summary;
        const safeDispenseData = JSON.stringify(dispenseSummary).replace(/"/g, "&quot;");

        const depositSummary = this.state.summary.deposit_summary;
        const safeDepositData = JSON.stringify(depositSummary).replace(/"/g, "&quot;");

        return `
            <div class="main-container">
                <div class="row">
                    <div class="column sm-6">
                        <div class="container">
                             <container-top icon="icon-arrow-down-left" title="Կանխիկացում"> </container-top>
                            <div class="radio-buttons">
                                <custom-radio name="cash-out" value="1" checked>Քարտով / Անքարտ</custom-radio>
                                <custom-radio name="cash-out" value="2">Ըստ վճարային համակարգի</custom-radio>
                                <custom-radio name="cash-out" value="3">Սեփական քարտ / Այլ քարտ</custom-radio>
                            </div> 
                            <div class="chart-container">
                              <doughnut-chart id="dispence-amount" title='${dispenseSummary.dispense_amount}' percentChange=${dispenseSummary.dispense_amount_percent_change} initData="${safeDispenseData}" type='amount' ></doughnut-chart>
                              <doughnut-chart id="dispence-count" title='${dispenseSummary.dispense_count}'  percentChange=${dispenseSummary.dispense_count_percent_change} initData="${safeDispenseData}" type='count'></doughnut-chart>
                            </div>
                          </div>      
                    </div>
                    <div class="column sm-6">
                        <div class="container">
                             <container-top icon="icon-arrow-up-right" title="Մուտքագրում"> </container-top>
                            <div class="radio-buttons">
                                <custom-radio name="cash-in" value="1" checked>Քարտով / Անքարտ</custom-radio>
                                <custom-radio name="cash-in" value="2">Ըստ տեսակի</custom-radio>
                            </div> 
                              <doughnut-chart id="deposit-amount" title='${depositSummary.deposit_amount}' percentChange=${depositSummary.deposit_amount_percent_change} initData="${safeDepositData}" type='amount' ></doughnut-chart>
                              <doughnut-chart id="deposit-count" title='${depositSummary.deposit_count}' percentChange=${depositSummary.deposit_count_percent_change} initData="${safeDepositData}" type='count' ></doughnut-chart>
                        </div>
                        
                    </div>
              </div>
            </div>
        `;
    }
}

customElements.define("in-out", inOut);
