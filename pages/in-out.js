import { DynamicElement } from "../core/dynamic-element.js";
import "../components/dynamic/chartComponent.js";
import "../components/dynamic/infoCard.js";
import "../components/ui/customTab.js";
import "../components/ui/customRadio.js";
import "../components/dynamic/doughnutChart.js";
import "../components/dynamic/select-box-search.js";
import "../components/dynamic/tabsDoughnutChart.js";

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

    onConnected() {
        this.fetchSummary();

        this.addEventListener("change", (e) => {
            if (e.target.matches('custom-radio[name="cash-in"]')) {
                const selected = e.target.getAttribute("value");
                this.updateDepositCharts(selected);
            } else if (e.target.matches('custom-radio[name="cash-out"]')) {
                console.log("click");

                const selected = e.target.getAttribute("value");
                this.updateDispenseCharts(selected);
            }
        });
    }

    updateDepositCharts(type) {
        const chartAmount = this.querySelector("#deposit-amount");
        const chartCount = this.querySelector("#deposit-count");

        if (chartAmount && chartCount) {
            chartAmount.setAttribute("activetab", type);
            chartCount.setAttribute("activetab", type);
        }
    }

    updateDispenseCharts(type) {
        const chartAmount = this.querySelector("#dispence-amount");
        const chartCount = this.querySelector("#dispence-count");

        if (chartAmount && chartCount) {
            console.log("new type", type);

            chartAmount.setAttribute("activetab", type);
            chartCount.setAttribute("activetab", type);
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
                          <div class="tab-content" data-tab="atms" style="display: none;">atms</div>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="column sm-6">

                        <div class="container">
                             <container-top icon="icon-arrow-down-left" title="Կանխիկացում"> </container-top>
                                                 <tabs-doughnut-chart id="dispense" summary="${safeDispenseData}"></tabs-doughnut-chart>
                           
                          </div>      
                    </div>
                    <div class="column sm-6">
                        <div class="container">
                             <container-top icon="icon-arrow-up-right" title="Մուտքագրում"> </container-top>
                            <div class="radio-buttons">
                                <custom-radio name="cash-in" value="1" checked>Քարտով / Անքարտ</custom-radio>
                                <custom-radio name="cash-in" value="2">Ըստ տեսակի</custom-radio>
                            </div> 
                              <doughnut-chart id="deposit-amount" title='${depositSummary.deposit_amount}' percentChange=${depositSummary.deposit_amount_percent_change} initData="${safeDepositData}" type='amount'  activetab="with_without_card"></doughnut-chart>
                              <doughnut-chart id="deposit-count" title='${depositSummary.deposit_count}' percentChange=${depositSummary.deposit_count_percent_change} initData="${safeDepositData}" type='count'  activetab="with_without_card"></doughnut-chart>
                        </div>
                    </div>
              </div>
            </div>
        `;
    }
}

customElements.define("in-out", inOut);




